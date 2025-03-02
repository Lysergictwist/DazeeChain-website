# DazeeChain Website

## Project Structure
```
dazeecoin-website/
├── api/
│   ├── db.js                 # MongoDB connection
│   ├── register-shelter.js   # Shelter registration endpoint
│   ├── shelter-count.js      # Shelter statistics endpoint
│   ├── test-db.js           # Database connection test
│   └── services/
│       ├── email.js         # SendGrid email service
│       └── storage.js       # AWS S3 storage service
├── admin/
│   ├── dashboard.html       # Admin dashboard
│   └── js/
│       └── dashboard.js     # Admin dashboard functionality
└── public/
    ├── index.html          # Main website
    └── register-shelter.html # Shelter registration form
```

## Environment Variables
The following environment variables need to be set in Vercel:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
NOTIFICATION_EMAIL=notifications@dazeechain.us
ADMIN_EMAIL=admin@dazeechain.us

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-west-1
AWS_BUCKET_NAME=dazeechain-shelter-docs
```

## Features Implemented

### Shelter Registration System
- Multi-step registration form
- Document upload capability
- Referral system with unique codes
- Email notifications
- Admin approval process

### Admin Dashboard
- Overview of shelter statistics
- Registration approval interface
- Document verification
- Referral tracking

### Storage
- Secure document storage in AWS S3
- Signed URLs for document access
- Automatic file organization by shelter

### Email Notifications
- New registration alerts
- Approval notifications
- Referral confirmations

## Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run locally: `npm run dev`

## Deployment
The project is deployed on Vercel with the following integrations:
- MongoDB Atlas for database
- SendGrid for email
- AWS S3 for storage

To deploy updates:
```bash
vercel
```

## Security Notes
- All API routes are protected
- Document access is controlled via signed URLs
- Database access is restricted by IP whitelist
- Environment variables are securely stored in Vercel
