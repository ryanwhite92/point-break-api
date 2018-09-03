# Point Break - a Vancouver Island surfer's guide to great surfing
Point Break is all about getting you the info you need in order to enjoy the best of Vancouver Island surfing. Point Break offers user registration, where a user may select up to 10 of their favorite Vancouver Island beaches. Users will then receive notifications via email or text, depending on their preference, telling them when the weather conditions are just right for a great day of surfing. 

Point Break also offers simplified surf forecasts on their home page so you can have a quick look at what the swell and wind will be like up to six days in advance. We've included a star-rating system so that you can interpret the forecast more easily if you're new to reading these types of forecasts. 

## Getting Started

1. Create the `.env` by using `.env.example` as a reference: `cp .env.example .env`
2. Update the .env file with your correct local information
3. Install dependencies: `npm i`
4. Fix to binaries for sass: `npm rebuild node-sass`
5. Run migrations: `npm run knex migrate:latest`
  - Check the migrations folder to see what gets created in the DB
6. Run the seed: `npm run knex seed:run`
  - Check the seeds file to see what gets seeded in the DB
7. Run the server: `npm start`
8. Run the front-end: [Point Break](https://github.com/hellocathleen/react-app) 
9. Visit `http://localhost:3000`

## Dependencies

- Node 5.10.x or above
- NPM 3.8.x or above
