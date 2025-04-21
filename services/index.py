from flask import Flask, request, jsonify, redirect, url_for
import os
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
import json
import requests
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import logging
import webbrowser

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# If modifying these scopes, delete the token.json file.
SCOPES = ['https://www.googleapis.com/auth/calendar']

# Set this to one of your approved redirect URIs
REDIRECT_URI = "http://localhost:5001/"

# List of possible credential filenames to check
CREDENTIAL_FILENAMES = [
    'credentials.json',
    'client_secret.json',
    'google_credentials.json',
    'calendar_credentials.json'
]

# This will store our OAuth flow object between requests
oauth_flow = None
credentials = None

def find_credentials_file():
    """Find the Google API credentials file in the current directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not script_dir:  # If __file__ is not available
        script_dir = os.getcwd()
        
    logging.info(f"Looking for credentials in directory: {script_dir}")
    
    # First check all possible filenames in the script directory
    for filename in CREDENTIAL_FILENAMES:
        filepath = os.path.join(script_dir, filename)
        if os.path.exists(filepath):
            logging.info(f"Found credentials file: {filepath}")
            return filepath
    
    # If not found, search through all files in the directory for potential credential files
    for file in os.listdir(script_dir):
        if file.endswith('.json'):
            filepath = os.path.join(script_dir, file)
            try:
                with open(filepath, 'r') as f:
                    content = json.load(f)
                    # Check if this looks like a Google credentials file
                    if 'web' in content or 'installed' in content:
                        logging.info(f"Found potential credentials file: {filepath}")
                        return filepath
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logging.warning(f"Error checking file {filepath}: {str(e)}")
    
    raise FileNotFoundError("Could not find Google credentials file. Please ensure you have a valid credentials file in the directory.")

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
    # But we'll return None and handle this situation separately
    logging.info("Need new authentication flow")
    return None

@app.route('/', methods=['GET'])
def index():
    """Home page that handles OAuth callback and provides UI."""
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
                
                return """
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                            h1 { color: #333; }
                            .success { background: #d6f5d6; padding: 10px; border-radius: 4px; }
                            .button { 
                                display: inline-block; 
                                background: #4285f4; 
                                color: white; 
                                padding: 10px 20px; 
                                text-decoration: none; 
                                border-radius: 4px; 
                                margin-top: 10px; 
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Authentication Successful</h1>
                        <div class="success">
                            <p>You have successfully authenticated with Google Calendar API.</p>
                        </div>
                        <p><a href="/calendar/events" class="button">View Calendar Events</a></p>
                    </body>
                </html>
                """
            else:
                return "Error: OAuth flow not initialized", 400
        except Exception as e:
            logging.error(f"Error completing OAuth flow: {str(e)}")
            return f"""
            <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                        h1 {{ color: #333; }}
                        .error {{ background: #ffe6e6; padding: 10px; border-radius: 4px; }}
                        .button {{ 
                            display: inline-block; 
                            background: #4285f4; 
                            color: white; 
                            padding: 10px 20px; 
                            text-decoration: none; 
                            border-radius: 4px; 
                            margin-top: 10px; 
                        }}
                    </style>
                </head>
                <body>
                    <h1>Authentication Error</h1>
                    <div class="error">
                        <p>Error: {str(e)}</p>
                    </div>
                    <p><a href="/auth" class="button">Try Again</a></p>
                </body>
            </html>
            """
    
    # Normal homepage
    is_authenticated = credentials and credentials.valid
    
    if is_authenticated:
        status = "Authenticated with Google Calendar API"
        auth_button = '<a href="/calendar/events" class="button">View Calendar Events</a>'
    else:
        status = "Not authenticated with Google Calendar API"
        auth_button = '<a href="/auth" class="button">Start Authentication</a>'
    
    return f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                h1 {{ color: #333; }}
                .button {{ 
                    display: inline-block; 
                    background: #4285f4; 
                    color: white; 
                    padding: 10px 20px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    margin-top: 10px; 
                }}
                .status {{ 
                    padding: 10px; 
                    background: {is_authenticated and '#d6f5d6' or '#ffe6e6'}; 
                    border-radius: 4px; 
                    margin: 10px 0; 
                }}
            </style>
        </head>
        <body>
            <h1>Google Calendar Integration</h1>
            <div class="status">{status}</div>
            {auth_button}
            <p>This application provides the following endpoints:</p>
            <ul>
                <li><strong>/calendar/events</strong> - Get all events from your Google Calendars</li>
                <li><strong>/syncFromJavascript</strong> - Sync events from your JavaScript endpoint to Google Calendar</li>
                <li><strong>/healthcheck</strong> - Check if the service is running</li>
            </ul>
        </body>
    </html>
    """

@app.route('/auth', methods=['GET'])
def start_auth():
    """Start the OAuth flow with a fixed redirect URI."""
    global oauth_flow
    
    try:
        # Find credentials file
        credentials_path = find_credentials_file()
        
        # Create the flow using the fixed redirect URI
        oauth_flow = Flow.from_client_secrets_file(
            credentials_path,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Generate authorization URL
        authorization_url, state = oauth_flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        # Open browser automatically to the auth URL
        webbrowser.open(authorization_url)
        
        return jsonify({
            'status': 200,
            'success': True
        }), 200
    except Exception as e:
        logging.error(f"Error starting OAuth flow: {str(e)}")
        return jsonify({
            'status': 400,
            'success': False
        }), 400

@app.route('/calendar/events', methods=['GET'])
def get_calendar_events():
    """Get all events from all calendars the user has access to."""
    global credentials
    
    try:
        # Get service or redirect to auth if needed
        service = get_google_calendar_service()
        if not service:
            if request.headers.get('Accept') == 'application/json':
                return jsonify({
                    'success': False,
                    'error': 'Authentication required',
                    'auth_url': url_for('start_auth', _external=True)
                }), 401
            else:
                return redirect(url_for('start_auth'))
        
        # Get all calendar lists that the user has access to
        calendar_list = service.calendarList().list().execute()
        
        all_events = []
        
        # Get time boundaries (1 month in the past to 1 year in the future)
        now = datetime.utcnow()
        time_min = (now - timedelta(days=30)).isoformat() + 'Z'  # 'Z' indicates UTC time
        time_max = (now + timedelta(days=365)).isoformat() + 'Z'
        
        # Iterate through each calendar and get events
        for calendar_entry in calendar_list.get('items', []):
            calendar_id = calendar_entry['id']
            calendar_name = calendar_entry.get('summary', 'Unknown Calendar')
            
            # Check if this is the primary calendar
            is_primary = calendar_entry.get('primary', False)
            logging.info(f"Fetching events from calendar: {calendar_name} (ID: {calendar_id})")
            
            try:
                # Get events from this calendar
                events_result = service.events().list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                logging.info(f"Found {len(events)} events in calendar {calendar_name}")
                
                # Process and format each event
                for event in events:
                    # Handle different datetime formats
                    start = event.get('start', {})
                    if 'dateTime' in start:
                        # This is a timed event
                        start_time = start.get('dateTime')
                    else:
                        # This is an all-day event
                        start_time = start.get('date') + 'T00:00:00Z'
                    
                    #end time
                    end = event.get('end', {})
                    if 'dateTime' in end:
                        end_time = end.get('dateTime')
                    else:
                        end_time = end.get('date') + 'T00:00:00Z'
                        
                    
                    
                    # Get attendees information
                    attendees = event.get('attendees', [])
                    invited_users = []
                    confirmed_users = []
                    not_coming_users = []
                    
                    for attendee in attendees:
                        email = attendee.get('email', '')
                        response_status = attendee.get('responseStatus', '')
                        
                        # This is simplified; in a real app, you would map emails to user IDs
                        invited_users.append(email)
                        
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
                        'is_holiday': 'holiday' in calendar_name.lower(),
                        'invited_users': invited_users,
                        'confirmed_users': confirmed_users,
                        'not_coming_users': not_coming_users,
                        # Include original Google Calendar event data for reference
                        'original_event': event
                    }
                    
                    all_events.append(formatted_event)
            except Exception as cal_error:
                logging.error(f"Error processing calendar {calendar_name}: {str(cal_error)}")
        
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': True,
                'events': all_events,
                'total_events': len(all_events)
            })
        else:
            # Simple HTML view for browser
            print(all_events)
            events_html = "".join([
                f"<div style='margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;'>"
                f"<h3>{event['title']}</h3>"
                f"<p><strong>Date/Time:</strong> {event['datetime']}</p>"
                f"<p><strong>Calendar:</strong> {event['calendar_name']}</p>"
                f"<p><strong>Location:</strong> {event.get('location', 'N/A')}</p>"
                f"<p><strong>Description:</strong> {event.get('description', 'N/A')}</p>"
                f"</div>"
                for event in all_events
            ])
            
            return f"""
            <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
                        h1 {{ color: #333; }}
                        .button {{ 
                            display: inline-block; 
                            background: #4285f4; 
                            color: white; 
                            padding: 10px 20px; 
                            text-decoration: none; 
                            border-radius: 4px; 
                            margin-top: 10px; 
                        }}
                    </style>
                </head>
                <body>
                    <h1>Your Calendar Events</h1>
                    <p>Found {len(all_events)} events across all your calendars.</p>
                    <p><a href="/" class="button">Back to Home</a></p>
                    <div>{events_html}</div>
                </body>
            </html>
            """
    
    except Exception as e:
        logging.error(f"Error in get_calendar_events: {str(e)}")
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        else:
            return f"""
            <html>
                <body>
                    <h1>Error</h1>
                    <p>{str(e)}</p>
                    <p><a href="/">Back to Home</a></p>
                </body>
            </html>
            """

# @app.route('/syncFromJavascript', methods=['GET', 'POST'])
# def sync_from_javascript():
#     """
#     Fetch events from JavaScript endpoint and add them to Google Calendar.
#     Returns both newly added events and all calendar events.
#     """
#     global credentials
    
#     try:
#         logging.info("Starting sync from JavaScript endpoint")
        
#         # Get service or redirect to auth if needed
#         service = get_google_calendar_service()
#         if not service:
#             if request.headers.get('Accept') == 'application/json':
#                 return jsonify({
#                     'success': False,
#                     'error': 'Authentication required',
#                     'auth_url': url_for('start_auth', _external=True)
#                 }), 401
#             else:
#                 return redirect(url_for('start_auth'))
        
#         # First, fetch events from the JavaScript endpoint
#         js_response = requests.get('http://localhost:5000/syncGoogleCallendar')
#         js_events = js_response.json()
#         logging.info(f"Fetched {len(js_events)} events from JavaScript endpoint")
        
#         # Track the events we've added
#         added_events = []
        
#         # Add each event to the primary calendar
#         for event in js_events:
#             try:
#                 # Create Google Calendar event object
#                 google_event = {
#                     'summary': event['title'],
#                     'location': event.get('location', ''),
#                     'description': format_description_from_event(event),
#                     'start': {
#                         'dateTime': event['datetime'],
#                         'timeZone': 'UTC',  # You might want to adjust this based on user preference
#                     },
#                     'end': {
#                         # Assuming each event is 1 hour by default if not specified
#                         'dateTime': add_hour_to_datetime(event['datetime']),
#                         'timeZone': 'UTC',
#                     },
#                 }
                
#                 # Add attendees if present
#                 if event.get('invitedUserIds', []):
#                     attendees = []
#                     # In a real app, you would convert user IDs to email addresses
#                     # This is a placeholder implementation
#                     for user_id in event.get('invitedUserIds', []):
#                         attendees.append({
#                             'email': f"user_{user_id}@example.com",  # Placeholder
#                             'responseStatus': 'needsAction'
#                         })
                    
#                     # Mark confirmed users
#                     for user_id in event.get('conformedUserIds', []):
#                         for attendee in attendees:
#                             if attendee['email'] == f"user_{user_id}@example.com":
#                                 attendee['responseStatus'] = 'accepted'
                    
#                     # Mark users who declined
#                     for user_id in event.get('notCommingUserIds', []):
#                         for attendee in attendees:
#                             if attendee['email'] == f"user_{user_id}@example.com":
#                                 attendee['responseStatus'] = 'declined'
                    
#                     google_event['attendees'] = attendees
                
#                 # Insert event to primary calendar
#                 logging.info(f"Adding event to Google Calendar: {event['title']}")
#                 created_event = service.events().insert(
#                     calendarId='primary',
#                     body=google_event
#                 ).execute()
                
#                 added_events.append({
#                     'original_event': event,
#                     'google_calendar_event': created_event
#                 })
#                 logging.info(f"Successfully added event: {event['title']}")
            
#             except Exception as evt_error:
#                 logging.error(f"Error adding event {event.get('title', 'unknown')}: {str(evt_error)}")
        
#         # Now fetch all calendar events to return a complete list
#         logging.info("Fetching all calendar events to include in response")
        
#         # Instead of calling the endpoint, we'll reuse the code to avoid redirect issues
#         all_events = []
        
#         # Get time boundaries (1 month in the past to 1 year in the future)
#         now = datetime.utcnow()
#         time_min = (now - timedelta(days=30)).isoformat() + 'Z'
#         time_max = (now + timedelta(days=365)).isoformat() + 'Z'
        
#         # Get calendar list
#         calendar_list = service.calendarList().list().execute()
        
#         # Process each calendar
#         for calendar_entry in calendar_list.get('items', []):
#             calendar_id = calendar_entry['id']
#             calendar_name = calendar_entry.get('summary', 'Unknown Calendar')
#             is_primary = calendar_entry.get('primary', False)
            
#             try:
#                 events_result = service.events().list(
#                     calendarId=calendar_id,
#                     timeMin=time_min,
#                     timeMax=time_max,
#                     singleEvents=True,
#                     orderBy='startTime'
#                 ).execute()
                
#                 for event in events_result.get('items', []):
#                     # Format event (simplified for brevity)
#                     start = event.get('start', {})
#                     start_time = start.get('dateTime', start.get('date', '') + 'T00:00:00Z')
                    
#                     formatted_event = {
#                         'id': event.get('id', ''),
#                         'title': event.get('summary', 'No Title'),
#                         'datetime': start_time,
#                         'location': event.get('location', ''),
#                         'description': event.get('description', ''),
#                         'calendar_name': calendar_name,
#                         'is_primary_calendar': is_primary,
#                     }
                    
#                     all_events.append(formatted_event)
#             except Exception as cal_error:
#                 logging.error(f"Error processing calendar {calendar_name}: {str(cal_error)}")
        
#         return jsonify({
#             'success': True,
#             'added_events': added_events,
#             'all_events': all_events,
#             'total_events_added': len(added_events)
#         })
    
#     except Exception as e:
#         logging.error(f"Error in sync_from_javascript: {str(e)}")
#         return jsonify({
#             'success': False,
#             'error': str(e)
#         }), 500

@app.route('/syncFromJavascript', methods=['POST'])
def sync_from_javascript():
    """
    Accept events from a JavaScript endpoint via POST and add them to Google Calendar.
    Returns both newly added events and all calendar events.
    """
    global credentials

    try:
        # logging.info("Starting sync from JavaScript endpoint")


        # # Get service or redirect to auth if needed
        # service = get_google_calendar_service()
        # if not service:
        #     if request.headers.get('Accept') == 'application/json':
        #         response = jsonify({
        #             'success': False,
        #             'error': 'Authentication required',
        #             'auth_url': url_for('start_auth', _external=True)
        #         }), 401
        #         if response.response(code = 200):
        #             pass
        #         else:
        #             return response
        #         # if response['status'] != 200:
        #         #     return response
        #     else:
        #         response = redirect(url_for('start_auth'))
        #         if response.response(code = 200):
        #             pass
        #         else:
        #             return response
        #         # if response['status'] != 200:
        #         #     return response

        logging.info("Starting sync from JavaScript endpoint")

        service = get_google_calendar_service()
        if not service:
            if request.headers.get('Accept') == 'application/json':
                auth_response = jsonify({
                    'success': False,
                    'error': 'Authentication required',
                    'auth_url': url_for('start_auth', _external=True)
                }), 401
            else:
                auth_response = redirect(url_for('start_auth'))
            
            if auth_response[1] == 200:
                service = get_google_calendar_service()
                if not service:
                    return auth_response
            else:
                return auth_response

        # Parse the JSON payload from the request
        js_events = request.get_json()
        if not js_events:
            logging.error("No JSON payload received")
            return jsonify({
                'success': False,
                'error': 'No JSON payload received'
            }), 400

        logging.info(f"Received {len(js_events)} events from JavaScript endpoint")

        # Track the events we've added
        added_events = []

        print(js_events)
        # Add each event to the primary calendar
        for event in js_events['userEvents']:
            try:
                # Create Google Calendar event object
                google_event = {
                    'summary': event['title'],
                    'location': event.get('location', ''),
                    'description': format_description_from_event(event),
                    'start': {
                        'dateTime': event['datetime'],
                        'timeZone': 'UTC',  # Adjust based on user preference
                    },
                    'end': {
                        # Assuming each event is 1 hour by default if not specified
                        'dateTime': add_hour_to_datetime(event['datetime']),
                        'timeZone': 'UTC',
                    },
                }

                # Add attendees if present
                if event.get('invitedUserIds', []):
                    attendees = []
                    for user_id in event.get('invitedUserIds', []):
                        attendees.append({
                            'email': f"user_{user_id}@example.com",  # Placeholder
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

        # Fetch all calendar events to return a complete list
        logging.info("Fetching all calendar events to include in response")
        all_events = []

        # Get time boundaries (1 month in the past to 1 year in the future)
        now = datetime.utcnow()
        time_min = (now - timedelta(days=30)).isoformat() + 'Z'
        time_max = (now + timedelta(days=365)).isoformat() + 'Z'

        # Get calendar list
        calendar_list = service.calendarList().list().execute()

        # Process each calendar
        for calendar_entry in calendar_list.get('items', []):
            calendar_id = calendar_entry['id']
            calendar_name = calendar_entry.get('summary', 'Unknown Calendar')
            is_primary = calendar_entry.get('primary', False)

            try:
                events_result = service.events().list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()

                for event in events_result.get('items', []):
                    # Format event (simplified for brevity)
                    start = event.get('start', {})
                    start_time = start.get('dateTime', start.get('date', '') + 'T00:00:00Z')

                    formatted_event = {
                        'id': event.get('id', ''),
                        'title': event.get('summary', 'No Title'),
                        'datetime': start_time,
                        'location': event.get('location', ''),
                        'description': event.get('description', ''),
                        'calendar_name': calendar_name,
                        'is_primary_calendar': is_primary,
                    }

                    all_events.append(formatted_event)
            except Exception as cal_error:
                logging.error(f"Error processing calendar {calendar_name}: {str(cal_error)}")

        return jsonify({
            'success': True,
            'added_events': added_events,
            'all_events': all_events,
            'total_events_added': len(added_events)
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
    # Use port 5001 since it's in your authorized redirect URIs
    app.run(host='localhost', port=5001, debug=True)