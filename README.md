# Wix Contacts Search

A web application to search for contacts in your Wix site using the Wix REST API, displaying contact information and their associated pricing plan subscriptions.

## Summary of Work Done

### Initial Implementation
- Created a search interface to query Wix Contacts API
- Implemented a proxy server to handle CORS issues and secure API credentials
- Added contact information display with proper formatting

### Enhanced Features
- Added Contact ID display for each contact to enable matching in other systems
- Integrated Wix Pricing Plans API to fetch subscription information for contacts
- Implemented filtering to ensure each contact only displays their own subscription information
- Added responsive UI elements for better user experience

### Wix API Integration
- Used Contact V4 API for querying contacts by name
- Implemented Pricing Plans Orders API to fetch subscription details
- Added server-side filtering to match subscriptions with the correct contact using member IDs

## Setup

1. Update the `wix.config.json` file with your Wix site credentials:
   ```json
   {
     "siteId": "your-site-id",
     "appId": "your-app-id",
     "apiKey": "your-api-key"
   }
   ```

   To get these values:
   - **siteId**: Go to your Wix Dashboard > Settings > General > Advanced > Site ID
   - **appId**: Create an app in the Wix Developer Center and get the App ID
   - **apiKey**: Generate an API Key in the Wix Developer Center for your app

   For detailed instructions on creating an app and generating API keys, visit the [Wix Developer Center](https://dev.wix.com/)

2. Install Node.js if you haven't already.

3. Run the server:
   ```
   node server.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

## How to Use

1. Enter a name (first name or last name) in the search box.
2. Click the "Search" button.
3. The application will query your Wix site's contacts and display matching results.
4. For contacts that are also members, their subscription information will be displayed.

## Features

- Search contacts by name using Wix Contacts API
- Display contact details including:
  - Name
  - Contact ID (for reference and matching)
  - Email
  - Phone
  - Company
  - Job Title
  - Member ID (if applicable)
- Display subscription information for members:
  - Plan name
  - Subscription status
  - Start date
  - End date (if applicable)

## Technical Details

This application uses:
- HTML, CSS, and JavaScript for the frontend
- Node.js for the server with proxy capabilities
- Wix REST API for querying contacts and subscription information
- Asynchronous JavaScript for fetching and displaying data

### Code Structure

The application consists of the following key files:

1. **index.html**
   - Main HTML file with the search interface and results container
   - Contains the basic structure and styling for the application

2. **app.js**
   - Client-side JavaScript that handles:
     - Form submission and validation
     - API requests to the server endpoints
     - Processing and displaying contact and subscription data
     - Error handling and user feedback

3. **server.js**
   - Node.js server that:
     - Serves static files (HTML, JS, CSS)
     - Acts as a proxy for Wix API requests
     - Handles authentication with Wix APIs
     - Performs additional data filtering
     - Manages CORS and error handling

4. **wix.config.json**
   - Configuration file for Wix API credentials
   - Contains siteId, appId, and apiKey for authentication

## API Implementation Details

### API Endpoints Used

This application interacts with the following Wix REST API endpoints:

1. **Query Contacts Endpoint**
   - **URL**: `https://www.wixapis.com/contacts/v4/contacts/query`
   - **Method**: POST
   - **Purpose**: Search for contacts by name (first or last)
   - **Request Body**:
     ```json
     {
       "query": {
         "filter": {
           "$or": [
             { "info.name.first": { "$startsWith": "searchTerm" } },
             { "info.name.last": { "$startsWith": "searchTerm" } }
           ]
         },
         "paging": {
           "limit": 10
         },
         "fieldsets": ["FULL"]
       }
     }
     ```
   - **Response**: Returns contacts matching the search criteria with full contact details

2. **List Orders by Member Endpoint**
   - **URL**: `https://www.wixapis.com/pricing-plans/v2/orders?memberId={memberId}`
   - **Method**: GET
   - **Purpose**: Retrieve subscription information for a specific member
   - **Parameters**: `memberId` - The ID of the member to fetch orders for
   - **Response**: Returns all orders/subscriptions associated with the specified member

### REST API Implementation

The application implements a proxy server architecture to securely interact with the Wix REST API:

1. **Authentication**
   - API credentials (API Key and Site ID) are stored securely in the `wix.config.json` file
   - The server reads these credentials and includes them in requests to the Wix API
   - Authentication is handled using the Bearer token approach with the API Key

2. **Proxy Server Implementation**
   - The Node.js server acts as a proxy between the client and Wix APIs
   - Client-side requests are sent to local endpoints on the server:
     - `/api/contacts/query` - For searching contacts
     - `/api/orders/member/{memberId}` - For fetching subscription information
   - The server forwards these requests to the appropriate Wix API endpoints with proper authentication
   - This approach prevents exposing API credentials to the client and handles CORS issues

3. **Data Filtering**
   - The server performs additional filtering on the subscription data:
     - When a request is made to `/api/orders/member/{memberId}`, the server fetches all orders
     - The server then filters the response to only include orders where the buyer's memberId matches the requested memberId
     - This ensures that each contact only sees their own subscription information

4. **Error Handling**
   - The server includes error handling for API requests:
     - HTTP status codes are preserved from the Wix API responses
     - Error messages are passed back to the client for display
     - JSON parsing errors are caught and handled appropriately

5. **Data Flow**
   - Client sends search query → Server proxies to Wix Contacts API → Results displayed to user
   - For each member in results → Client requests subscription data → Server fetches and filters from Wix Pricing Plans API → Subscription data displayed with contact

## Wix API Documentation Referenced

### Contacts API
- [Contacts V4 Introduction](https://dev.wix.com/docs/rest/crm/members-contacts/contacts/contacts/contact-v4/introduction)
- [Query Contacts Method](https://dev.wix.com/docs/rest/crm/members-contacts/contacts/contacts/contact-v4/query-contacts)
- [Sort, Filter and Search Contacts](https://dev.wix.com/docs/rest/crm/members-contacts/contacts/contacts/contact-v4/sort-filter-and-search)

### Pricing Plans API
- [Pricing Plans Introduction](https://dev.wix.com/docs/rest/business-solutions/pricing-plans/pricing-plans/introduction)
- [Orders Introduction](https://dev.wix.com/docs/rest/business-solutions/pricing-plans/pricing-plans/orders/introduction)
- [List Orders Method](https://dev.wix.com/docs/rest/business-solutions/pricing-plans/pricing-plans/orders/member-orders-service-list-orders)

## Future Enhancements

Potential future enhancements could include:
- Adding pagination for large result sets
- Implementing more advanced search filters
- Adding the ability to update contact information
- Integrating with additional Wix APIs for more comprehensive information
