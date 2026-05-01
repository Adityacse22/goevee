Evee

Evee is a full-stack EV charging station discovery and booking platform that helps electric vehicle users find nearby charging stations, check charger availability, estimate when an occupied charger will be free, and reserve charging slots in advance.

It combines a modern frontend experience with a scalable backend architecture so users can search stations on a map, view charger details, manage bookings, and interact with a production-style EV charging workflow.

Table of Contents
Overview

Problem Statement

Key Features

Tech Stack

Frontend

Backend

System Architecture

MVC Architecture

Core Modules

Google Maps Integration

Booking and Availability Logic

Authentication and Authorization

Validation Strategy

Database Design

Suggested Schema

Project Structure

API Design

Environment Variables

Installation and Setup

Running with Docker

Drizzle ORM Setup

Frontend Development

Backend Development

Available Scripts

Deployment

Testing Strategy

Security Considerations

Scalability Considerations

Future Enhancements

Why Evee Matters

License

Overview
Evee is designed for EV users who want a reliable way to discover nearby charging stations and reserve a charger without uncertainty.

The platform focuses on solving real charging pain points such as:

Finding a nearby station quickly.

Knowing whether a charger is available right now.

Estimating when a busy charger will become free.

Booking a time slot before reaching the station.

Managing charging sessions and reservations from one place.

This project is intended as a real-world full-stack product with a clean frontend, API-driven backend, scalable database design, and strong support for future production features.

Problem Statement
EV charging users often face these challenges:

Nearby stations appear on maps, but users cannot easily verify real availability.

Occupied chargers do not clearly indicate when they may become free.

Many systems do not support smooth, conflict-free advance booking.

Station data is often fragmented between maps, apps, and network-specific platforms.

Evee addresses these problems by combining location search, live charger visibility, reservation workflows, and intelligent availability estimation in a single product.

Key Features
User-facing features
Search nearby EV charging stations using map-based location search.

View station details such as connector type, charger count, power output, pricing, and amenities.

Check whether a charger is available, occupied, reserved, offline, or under maintenance.

See estimated charger free time for better trip planning.

Book a charging slot for a selected time window.

Cancel or manage bookings.

Save favorite stations.

Manage vehicles inside the user account.

View booking history and future reservations.

Operator/admin features
Add and manage charging stations.

Add chargers under each station.

Update charger status and station metadata.

Monitor bookings and charger utilization.

Manage users, operators, and station approvals.

Product-level features
Responsive frontend experience.

REST API based backend.

Role-based access control.

Input validation using Zod.

PostgreSQL database with Drizzle ORM.

Dockerized local database setup.

Google Maps API for discovery and geo search.

Tech Stack
Frontend
Vite

TypeScript

React

shadcn-ui

Tailwind CSS

Backend
Node.js

Express.js

JWT

Zod

PostgreSQL

Drizzle ORM

Infrastructure and tooling
Docker

Docker Compose

npm

GitHub

Lovable for rapid frontend editing and publishing

External APIs
Google Maps API

Frontend
The frontend is designed as a modern web application for EV users to search, browse, and reserve charging stations.

Frontend stack
Vite for fast development and build tooling.

TypeScript for safer and more maintainable frontend code.

React for building reusable UI components.

shadcn-ui for accessible and customizable UI building blocks.

Tailwind CSS for rapid and consistent styling.

Frontend responsibilities
The frontend handles:

User-facing pages and flows.

Search and filter UI for nearby stations.

Station detail screens.

Booking forms and booking history views.

Authentication screens.

Responsive layouts for desktop and mobile.

Map visualization and user interaction around station discovery.

Suggested frontend pages
Home page

Nearby stations page

Station details page

Charger details section

Booking page

My bookings page

Favorites page

Profile page

Login and signup pages

Operator dashboard

Admin dashboard

Frontend development note
The current frontend setup also supports editing through Lovable, and local development remains possible through a normal Vite-based workflow.

Backend
The backend powers the core logic of Evee and is responsible for data consistency, booking safety, and station management.

Backend stack
Node.js as the runtime.

Express.js for REST API development.

JWT for stateless authentication.

Zod for request validation.

PostgreSQL as the relational database.

Drizzle ORM for schema modeling, migrations, and type-safe queries.

Backend responsibilities
The backend handles:

Authentication and authorization.

User and vehicle management.

Station and charger management.

Slot booking and cancellation.

Charger availability estimation.

Booking conflict prevention.

Google Maps integration logic.

Admin and operator workflows.

System Architecture
Evee is best designed as a full-stack application with a clear split between presentation, business logic, and data persistence.

text
Frontend (React + Vite + Tailwind)
        ↓
REST API Layer (Express.js)
        ↓
Controllers → Services → Repositories
        ↓
Drizzle ORM
        ↓
PostgreSQL
        ↓
External Services (Google Maps API)
Architecture goals
Keep frontend and backend loosely coupled.

Make the backend reusable for web and mobile clients.

Keep controller logic thin.

Place business rules inside service layers.

Centralize DB access for maintainability.

Make the project easy to scale later.

MVC Architecture
The backend follows the MVC pattern, adapted for REST APIs.

What MVC means in Evee
Model: Database schema and data access logic using Drizzle ORM.

View: JSON responses returned to the frontend instead of server-rendered templates.

Controller: Request handlers that connect routes to services.

Extended layered structure
To keep the project cleaner, Evee can use a practical MVC + service + repository approach:

Routes

Controllers

Services

Repositories

Database schema

Middlewares

Validators

Utilities

Why this structure works well
Easier to test.

Easier to scale.

Cleaner separation of concerns.

Better readability for team collaboration.

Reduced controller complexity.

Core Modules
1. Auth module
Handles:

Signup

Login

Token generation

Password hashing

Current user retrieval

Role checks

2. User module
Handles:

User profile

Vehicle management

Favorite stations

Booking history

3. Station module
Handles:

Station creation

Station details

Nearby station search

Station metadata

Operator-owned station management

4. Charger module
Handles:

Charger creation

Charger status updates

Connector and power metadata

Estimated next available time

5. Booking module
Handles:

Slot reservation

Booking cancellation

Booking history

Overlap prevention

Booking lifecycle changes

6. Maps module
Handles:

Geocoding

Reverse geocoding

Nearby search support

Place-to-coordinate conversion

Distance-related enrichment

Google Maps Integration
Google Maps API is used as the location intelligence layer of Evee.

Main use cases
Convert place names into coordinates.

Convert coordinates into readable addresses.

Help users search nearby charging stations.

Improve search when users type city, area, landmark, or pincode.

Support frontend map rendering and station visualization.

Rank station results using location context.

Recommended Google APIs
Geocoding API

Places API

Maps JavaScript API

Distance Matrix API for later route-aware ranking

Best practice
Use Google Maps for location intelligence, but keep core product data such as stations, chargers, bookings, users, and availability in your own PostgreSQL database.

Booking and Availability Logic
This is the core feature of Evee.

Charger status values
AVAILABLE

OCCUPIED

RESERVED

OUT_OF_SERVICE

MAINTENANCE

Booking status values
PENDING

CONFIRMED

ACTIVE

COMPLETED

CANCELLED

EXPIRED

Availability inputs
A charger's real availability should be computed using:

Active charging session state

Future confirmed bookings

Maintenance windows

Station operating hours

Buffer time between sessions

Operator-updated charger status

Overlap rule
To prevent double booking:

text
requestedStart < existingEnd && requestedEnd > existingStart
If this expression is true, the slot overlaps with an existing reservation and should be rejected.

Estimated free time
The system can estimate the next available time using:

Current charging session end time

Latest valid booking end time

A configurable buffer such as 10–15 minutes

Authentication and Authorization
Authentication and access control are critical because users, operators, and admins have different permissions.

Authentication flow
User registers using email and password.

Password is hashed before storing.

User logs in and receives a JWT token.

Protected routes require a bearer token.

Middleware verifies the token and adds user context to the request.

Authorization flow
Use role-based access control:

USER

OPERATOR

ADMIN

Recommended JWT payload
json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER"
}
Protected route examples
Users can manage only their own bookings.

Operators can manage only their stations and chargers.

Admins can manage platform-wide resources.

Validation Strategy
All incoming requests should be validated using Zod.

Validate these layers
Request body

Query params

Route params

Headers where needed

Example validation use cases
Register payload

Login payload

Booking create payload

Station search query

Charger creation payload

Status update payload

Why Zod fits well
Strong schema clarity

Easy reusable validation rules

Safer request handling

Better error messages for the frontend

Database Design
PostgreSQL is a strong fit because Evee needs relational consistency and reliable booking transactions.

Core relationships
One user can have many vehicles.

One operator can manage many stations.

One station can have many chargers.

One charger can have many bookings.

One user can create many bookings.

One booking can optionally create one charging session.

Recommended database practices
Use UUID primary keys.

Add timestamps to major entities.

Index booking time ranges and charger foreign keys.

Use transactions for booking creation.

Add guardrails for race conditions in concurrent booking scenarios.

Suggested Schema
users
id

full_name

email

password_hash

role

phone

created_at

updated_at

vehicles
id

user_id

vehicle_name

brand

model

connector_type

battery_capacity

created_at

stations
id

operator_id

name

address

city

state

country

pincode

latitude

longitude

status

opening_time

closing_time

pricing_details

amenities

created_at

updated_at

chargers
id

station_id

charger_code

connector_type

power_output_kw

current_type

status

estimated_available_at

created_at

updated_at

bookings
id

user_id

charger_id

vehicle_id

start_time

end_time

status

total_price

booking_reference

created_at

updated_at

charging_sessions
id

booking_id

charger_id

actual_start_time

actual_end_time

energy_consumed_kwh

session_status

created_at

favorites
id

user_id

station_id

created_at

reviews
id

user_id

station_id

rating

comment

created_at

Project Structure
A practical monorepo-style or combined repository structure could look like this:

text
evee/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   ├── migrations/
│   │   │   └── index.js
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── app.js
│   │   └── server.js
│   ├── drizzle.config.js
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
If you keep a single repository without splitting client and server, the same module structure can still be adapted inside one root project.

API Design
Auth routes
POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me

User routes
GET /api/v1/users/profile

PATCH /api/v1/users/profile

POST /api/v1/users/vehicles

GET /api/v1/users/bookings

GET /api/v1/users/favorites

Station routes
POST /api/v1/stations

GET /api/v1/stations

GET /api/v1/stations/nearby

GET /api/v1/stations/:stationId

PATCH /api/v1/stations/:stationId

Charger routes
POST /api/v1/chargers

GET /api/v1/chargers/:chargerId

PATCH /api/v1/chargers/:chargerId/status

GET /api/v1/stations/:stationId/chargers

Booking routes
POST /api/v1/bookings

GET /api/v1/bookings/:bookingId

GET /api/v1/bookings/me

PATCH /api/v1/bookings/:bookingId/cancel

Environment Variables
Frontend
text
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_BASE_URL=http://localhost:5000/api/v1
Backend
text
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/evee
JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=1d
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
APP_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=10
Installation and Setup
1. Clone the repository
bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
2. Install dependencies
If using a single root project:

bash
npm install
If using separate frontend and backend folders:

bash
cd client && npm install
cd ../server && npm install
3. Create environment files
Create .env files for frontend and backend using the variable templates above.

4. Start PostgreSQL with Docker
bash
docker compose up -d
5. Run database migrations
bash
npm run db:generate
npm run db:migrate
6. Start development servers
Frontend:

bash
npm run dev
Backend:

bash
npm run dev
Running with Docker
A simple PostgreSQL setup can be used for local development.

text
version: '3.9'
services:
  postgres:
    image: postgres:16
    container_name: evee-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: evee
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - evee_pg_data:/var/lib/postgresql/data

volumes:
  evee_pg_data:
This keeps local development repeatable and avoids machine-specific database setup problems.

Drizzle ORM Setup
Install packages
bash
npm install drizzle-orm pg
npm install -D drizzle-kit
Example scripts
json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
Typical flow
Define schema files.

Configure drizzle.config.js.

Generate migrations.

Run migrations.

Use Drizzle queries inside repositories or services.

Frontend Development
The current frontend is based on a standard Vite workflow and can also be edited through Lovable.

Local frontend workflow
bash
npm install
npm run dev
Current frontend technology note
The existing project README indicates that the frontend is built with:

Vite

TypeScript

React

shadcn-ui

Tailwind CSS

Editing options
You can work on the frontend in multiple ways:

Use Lovable for prompt-based edits.

Use a local IDE such as VS Code.

Edit files directly in GitHub.

Use GitHub Codespaces.

Backend Development
The backend is best developed locally using Node.js, Express.js, and PostgreSQL.

Local backend workflow
bash
npm install
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev
Suggested backend package groups
Runtime dependencies: express, jsonwebtoken, zod, bcrypt, dotenv, pg, drizzle-orm

Dev dependencies: nodemon, drizzle-kit

Available Scripts
Frontend
bash
npm run dev
npm run build
npm run preview
Backend
bash
npm run dev
npm run start
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
Deployment
Frontend deployment
If you continue using Lovable for the frontend, the project can be published directly through its Share → Publish flow.

Custom domain
A custom domain can be connected from the project domain settings inside Lovable.

Backend deployment ideas
For production deployment, consider:

Node.js server on a VPS or cloud platform

Managed PostgreSQL database

Reverse proxy such as Nginx

HTTPS certificates

Environment-based secret management

Monitoring and logging

Testing Strategy
Recommended test layers
Unit tests for services

Integration tests for API routes

Validation tests for Zod schemas

Booking conflict tests

Auth and role access tests

Frontend component tests

Frontend page flow tests

Critical scenarios to test
Login and signup success/failure

Invalid token access

Booking overlap rejection

Booking on unavailable charger

Nearby station search response

Charger next-free-time estimation

Operator-only and admin-only route protection

Security Considerations
Hash passwords before saving them.

Keep JWT secrets private.

Use HTTPS in production.

Add CORS rules for trusted frontend origins.

Validate all input using Zod.

Rate limit auth and booking endpoints.

Avoid exposing internal stack traces in production.

Protect admin and operator routes with role-based middleware.

Scalability Considerations
As Evee grows, the following improvements can help:

Redis for caching and rate limiting.

WebSocket or polling for near real-time charger updates.

Queue-based notifications.

Better geo indexing for large station datasets.

Booking engine improvements for high concurrency.

Analytics dashboards for operators and admins.

Mobile app clients using the same REST API backend.

Future Enhancements
Live charger telemetry integration

Payment gateway support

Notification reminders for upcoming bookings

Waitlist for busy chargers

Smarter station recommendations

EV route planning with charging stops

Station reviews and ratings

Subscription plans for premium users

Admin reporting and analytics

Multi-language support

Why Evee Matters
Evee is more than a charger listing app. It is designed as a complete EV charging experience platform where search, discovery, trust, availability, and booking work together.

From a portfolio perspective, this project demonstrates:

Real-world product thinking

Full-stack architecture skills

API design

Database modeling

Authentication and authorization

Mapping integration

Booking-system design

Scalable engineering mindset

License
This project is currently intended for learning, portfolio, and product development purposes.

You can replace this section later with your preferred license, such as MIT.