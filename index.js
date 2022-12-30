
// Lichess Worldbeater
// Gabriel Williams, 2022

const query = require('./query');
const cc = require('./country_codes');
require('dotenv').config();

const token = process.env.lichessToken;
const user = process.argv[2]
const codes = Object.keys(cc.isoCountries);

const vsWorld = async function() {
    const tracked = await query.streamGames(user, token);
    const opponents = Object.keys(tracked);
    console.log(`${user}: ${Object.keys(opponents).length} unique opponents since 1 Jan 2022`);

    var users = []
    for (let i = 0; i < opponents.length; i+=300) {
        const chunk = opponents.slice(i, i+300)
        const body = chunk.join(',');
        const records = await query.streamUsers(body, token);
        users = users.concat(records);
    }
    
    const hasProfile = users.filter(user => user.hasOwnProperty('profile'));
    const hasCountry = hasProfile.filter(user => user.profile.hasOwnProperty('country'));
    const hasValid = hasCountry.filter(user => codes.includes(user.profile.country));
    const opponentMap = hasValid.reduce((acc, user) => Object.assign(acc, {
        [user.id]: user.profile.country
    }), {});

    const countries = [... new Set(Object.values(opponentMap))];
    const tally = countries.reduce((acc,curr)=> (
        acc[curr]={win: 0, loss: 0, draw: 0},
    acc),{});

    for (id in opponentMap) {
        const country = opponentMap[id];
        const { win, loss, draw } = tracked[id];
        tally[country].win += win;
        tally[country].loss += loss;
        tally[country].draw += draw;
    }

    const totals = [];
    for (country in tally) {
        const { win, loss, draw } = tally[country];
        const total = win+loss+draw;
        totals.push([country, total]);
    }

    const sortedTotals = Object.fromEntries(
        totals.sort(([,a],[,b]) => b-a)
    );

    for (country in sortedTotals) {
        const { win, loss, draw } = tally[country];
        const record = `${win}-${loss}-${draw}`;
        const percentage = (win/(win+loss+draw)*100).toFixed(0);
        const getName = new Intl.DisplayNames(['en'], { type: 'region' });
        const regionName = getName.of(country);
        console.log(`${percentage}% win rate against ${regionName}. (${record})`);
    }
}

vsWorld();
