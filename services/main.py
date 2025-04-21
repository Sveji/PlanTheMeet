from flask import Flask, request, jsonify, redirect, url_for
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
import json
import requests
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import logging
import webbrowser

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# If modifying these scopes, delete the token.json file.
SCOPES = ['https://www.googleapis.com/auth/calendar']

# Set this to one of your approved redirect URIs
REDIRECT_URI = "http://localhost:5001/oauth2callback"

# This will store our OAuth flow object between requests
oauth_flow = None
credentials = None

def find_credentials_file():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json')

def get_google_calendar_service():
    """Get Google Calendar API service object."""
    global credentials
    token_path = os.path.join(os.path.dirname(os.path.abspath(__file__)) or os.getcwd(), 'token.json')
    
    # If we already have valid credentials, use them
    if credentials and credentials.valid:
        return build('calendar', 'v3', credentials=credentials)
    
    # Try to load saved credentials
    if os.path.exists(token_path):
        try:
            with open(token_path, 'r') as token_file:
                creds_data = json.load(token_file)
                credentials = Credentials.from_authorized_user_info(creds_data)
                logging.info("Loaded existing credentials from token.json")
        except Exception as e:
            logging.warning(f"Error loading token.json: {str(e)}")
    
    # If there are valid credentials now, use them
    if credentials and credentials.valid:
        return build('calendar', 'v3', credentials=credentials)
    
    # If credentials exist but are expired, refresh them
    if credentials and credentials.expired and credentials.refresh_token:
        try:
            logging.info("Refreshing expired credentials")
            credentials.refresh(Request())
            
            # Save the refreshed credentials
            with open(token_path, 'w') as token:
                token.write(credentials.to_json())
                logging.info(f"Saved refreshed credentials to {token_path}")
            
            return build('calendar', 'v3', credentials=credentials)
        except Exception as e:
            logging.error(f"Error refreshing credentials: {str(e)}")
    
    # If we get here, we need a new OAuth flow
    logging.info("Need new authentication flow")
    return None

@app.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    """Handle the OAuth callback from Google."""
    global credentials, oauth_flow
    
    # Check if this is an OAuth callback with a code
    if 'code' in request.args:
        try:
            # This means we're receiving the OAuth callback
            logging.info("Received OAuth callback with authorization code")
            
            # Complete the OAuth flow
            if oauth_flow:
                oauth_flow.fetch_token(authorization_response=request.url)
                credentials = oauth_flow.credentials
                
                # Save credentials to file
                token_path = os.path.join(os.path.dirname(os.path.abspath(__file__)) or os.getcwd(), 'token.json')
                with open(token_path, 'w') as token:
                    token.write(credentials.to_json())
                    logging.info(f"Saved credentials to {token_path}")
                
                # Redirect to the original requesting origin
                frontend_url = request.args.get('state', 'http://localhost:3000')
                return redirect(frontend_url)
            else:
                return jsonify({
                    'success': False,
                    'error': 'OAuth flow not initialized'
                }), 400
        except Exception as e:
            logging.error(f"Error completing OAuth flow: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # If no code parameter, something went wrong
    return jsonify({
        'success': False,
        'error': 'No authorization code received'
    }), 400

@app.route('/auth', methods=['GET'])
def start_auth():
    """Start the OAuth flow with parameters from the request."""
    global oauth_flow
    
    # Origin of the request - where to redirect back after authentication
    origin = request.args.get('origin', 'http://localhost:3000')
    
    try:
        # Find credentials file
        credentials_path = find_credentials_file()
        
        # Create the flow using the redirect URI
        oauth_flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Generate authorization URL, using origin as state
        authorization_url, state = oauth_flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=origin
        )
        
        # Return the auth URL for frontend to redirect
        return jsonify({
            'success': True,
            'auth_url': authorization_url
        })
    except Exception as e:
        logging.error(f"Error starting OAuth flow: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/syncFromJavascript', methods=['POST'])
def sync_from_javascript():
    """
    Accept events from a JavaScript endpoint via POST and add them to Google Calendar.
    Returns both newly added events and all calendar events.
    """
    global credentials

    try:
        logging.info("Starting sync from JavaScript endpoint")

        # Get service or return auth needed response
        service = get_google_calendar_service()
        if not service:
            return jsonify({
                'success': False,
                'error': 'Authentication required',
                'auth_url': url_for('start_auth', _external=True)
            }), 401

        # Parse the JSON payload from the request
        request_data = request.get_json()
        if not request_data or 'userEvents' not in request_data:
            logging.error("No valid JSON payload received")
            return jsonify({
                'success': False,
                'error': 'No valid events data received'
            }), 400

        js_events = request_data['userEvents']
        logging.info(f"Received {len(js_events)} events from JavaScript endpoint")

        # Get date filter parameters if provided
        year = request.args.get('year')
        month = request.args.get('month')
        
        # Track the events we've added
        added_events = []
        existing_events = []
        
        # First, get existing events to avoid duplicates
        try:
            # Get time boundaries (by default 1 month in the past to 1 year in the future)
            now = datetime.utcnow()
            
            # If specific year/month are requested, adjust time boundaries
            if year and month:
                try:
                    month_num = int(month)
                    year_num = int(year)
                    time_min = datetime(year_num, month_num, 1).isoformat() + 'Z'
                    
                    # For month filter, set max to end of month
                    if month_num == 12:
                        time_max = datetime(year_num + 1, 1, 1).isoformat() + 'Z'
                    else:
                        time_max = datetime(year_num, month_num + 1, 1).isoformat() + 'Z'
                except ValueError:
                    # If invalid date, use default time range
                    time_min = (now - timedelta(days=30)).isoformat() + 'Z'
                    time_max = (now + timedelta(days=365)).isoformat() + 'Z'
            elif year:
                try:
                    year_num = int(year)
                    time_min = datetime(year_num, 1, 1).isoformat() + 'Z'
                    time_max = datetime(year_num + 1, 1, 1).isoformat() + 'Z'
                except ValueError:
                    time_min = (now - timedelta(days=30)).isoformat() + 'Z'
                    time_max = (now + timedelta(days=365)).isoformat() + 'Z'
            else:
                time_min = (now - timedelta(days=30)).isoformat() + 'Z'
                time_max = (now + timedelta(days=365)).isoformat() + 'Z'
                
            # Get events from primary calendar
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            primary_events = events_result.get('items', [])
            
            # Create a set of existing event titles for duplication check
            existing_titles = {event.get('summary', ''): event for event in primary_events}
            logging.info(f"Found {len(existing_titles)} existing events in primary calendar")
                
        except Exception as e:
            logging.error(f"Error fetching existing events: {str(e)}")
            existing_titles = {}

        # Add each event to the primary calendar
        for event in js_events:
            try:
                # Check if this event already exists (by title for simplicity)
                if event['title'] in existing_titles:
                    logging.info(f"Event '{event['title']}' already exists in calendar, skipping")
                    existing_events.append({
                        'original_event': event,
                        'google_calendar_event': existing_titles[event['title']]
                    })
                    continue
                
                # Extract end time if provided, otherwise add 1 hour to start time
                start_datetime = event['datetime']
                if 'endtime' in event and event['endtime']:
                    end_datetime = event['endtime']
                else:
                    end_datetime = add_hour_to_datetime(start_datetime)
                
                # Create Google Calendar event object
                google_event = {
                    'summary': event['title'],
                    'location': event.get('location', ''),
                    'description': format_description_from_event(event),
                    'start': {
                        'dateTime': start_datetime,
                        'timeZone': 'UTC',
                    },
                    'end': {
                        'dateTime': end_datetime,
                        'timeZone': 'UTC',
                    },
                }

                # Add attendees if present
                attendees = []
                if event.get('invitedUserIds', []):
                    for user_id in event.get('invitedUserIds', []):
                        attendees.append({
                            'email': f"user_{user_id}@example.com",
                            'responseStatus': 'needsAction'
                        })

                # Mark confirmed users
                for user_id in event.get('conformedUserIds', []):
                    for attendee in attendees:
                        if attendee['email'] == f"user_{user_id}@example.com":
                            attendee['responseStatus'] = 'accepted'

                # Mark users who declined
                for user_id in event.get('notCommingUserIds', []):
                    for attendee in attendees:
                        if attendee['email'] == f"user_{user_id}@example.com":
                            attendee['responseStatus'] = 'declined'

                if attendees:
                    google_event['attendees'] = attendees

                # Insert event to primary calendar
                logging.info(f"Adding event to Google Calendar: {event['title']}")
                created_event = service.events().insert(
                    calendarId='primary',
                    body=google_event
                ).execute()

                added_events.append({
                    'original_event': event,
                    'google_calendar_event': created_event
                })
                logging.info(f"Successfully added event: {event['title']}")

            except Exception as evt_error:
                logging.error(f"Error adding event {event.get('title', 'unknown')}: {str(evt_error)}")

        # Now fetch all calendar events from all calendars
        all_events = []
        calendar_list = service.calendarList().list().execute()
        
        # Process each calendar
        for calendar_entry in calendar_list.get('items', []):
            calendar_id = calendar_entry['id']
            calendar_name = calendar_entry.get('summary', 'Unknown Calendar')
            is_primary = calendar_entry.get('primary', False)
            is_holiday = 'holiday' in calendar_name.lower()
            
            try:
                events_result = service.events().list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()

                for event in events_result.get('items', []):
                    # Format event
                    start = event.get('start', {})
                    if 'dateTime' in start:
                        start_time = start.get('dateTime')
                    else:
                        start_time = start.get('date') + 'T00:00:00Z'
                    
                    end = event.get('end', {})
                    if 'dateTime' in end:
                        end_time = end.get('dateTime')
                    else:
                        end_time = end.get('date') + 'T00:00:00Z'
                    
                    # Process attendees
                    attendees = event.get('attendees', [])
                    invited_users = []
                    confirmed_users = []
                    not_coming_users = []
                    
                    for attendee in attendees:
                        email = attendee.get('email', '')
                        invited_users.append(email)
                        
                        response_status = attendee.get('responseStatus', '')
                        if response_status == 'accepted':
                            confirmed_users.append(email)
                        elif response_status == 'declined':
                            not_coming_users.append(email)
                    
                    formatted_event = {
                        'id': event.get('id', ''),
                        'title': event.get('summary', 'No Title'),
                        'datetime': start_time,
                        'endtime': end_time,
                        'location': event.get('location', ''),
                        'description': event.get('description', ''),
                        'calendar_name': calendar_name,
                        'is_primary_calendar': is_primary,
                        'is_holiday': is_holiday,
                        'invited_users': invited_users,
                        'confirmed_users': confirmed_users,
                        'not_coming_users': not_coming_users
                    }
                    
                    all_events.append(formatted_event)
            except Exception as cal_error:
                logging.error(f"Error processing calendar {calendar_name}: {str(cal_error)}")

        return jsonify({
            'success': True,
            'added_events': added_events,
            'existing_events': existing_events,
            'all_events': all_events,
            'total_events_added': len(added_events),
            'total_events': len(all_events)
        })

    except Exception as e:
        logging.error(f"Error in sync_from_javascript: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def format_description_from_event(event):
    """Format a nice description from the event data."""
    description = event.get('description', '')
    
    # Add information about invited/confirmed/not coming users
    if event.get('invitedUserIds'):
        description += "\n\nInvited Users: " + ", ".join([f"User {uid}" for uid in event.get('invitedUserIds', [])])
    
    if event.get('conformedUserIds'):
        description += "\n\nConfirmed Users: " + ", ".join([f"User {uid}" for uid in event.get('conformedUserIds', [])])
    
    if event.get('notCommingUserIds'):
        description += "\n\nNot Coming: " + ", ".join([f"User {uid}" for uid in event.get('notCommingUserIds', [])])
    
    return description

def add_hour_to_datetime(datetime_str):
    """Add one hour to a datetime string."""
    # Handle various date formats
    if 'T' not in datetime_str:
        # If only date is provided, add time
        datetime_str = datetime_str + 'T00:00:00Z'
    
    # Remove Z if present and add UTC timezone info
    datetime_str = datetime_str.replace('Z', '+00:00')
    
    try:
        dt = datetime.fromisoformat(datetime_str)
    except ValueError:
        # Some additional date format handling
        try:
            dt = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S%z')
        except ValueError:
            dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S%z')
    
    dt = dt + timedelta(hours=1)
    return dt.isoformat().replace('+00:00', 'Z')

@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    """Simple endpoint to check if the service is running."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logging.info("Starting Google Calendar Integration Service")
    # Use port 5001 for the API service
    app.run(host='localhost', port=5001, debug=True)