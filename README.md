# lichess-worldbeater
## Takes a lichess account ID and prints their record and win rate against each country.

Queries two lichess.org API endpoints: 
  - api/games/user/{user} to query games played,
  - /api/users to lookup region for each opponent,

and then compiles the user's record against all valid opponents for the a given time period.

![Demo](/../media/grim_trigger.jpg?raw=true "Demo")
