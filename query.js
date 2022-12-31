


const fetch = require('node-fetch');

const Jan2022 = 1640995200000;
const Nov2022 = 1667265383000;

function streamGames(user, token) {

    const tracker = {};

    const params = new URLSearchParams({
      since: Jan2022
    });

    const streamheader = {
      headers: {
          Accept:'application/x-ndjson',
          Authorization: 'Bearer ' + token
      }
    }
    
    const stream = fetch(`https://lichess.org/api/games/user/${user}?` + params, streamheader);

    const onMessage = (obj) => {

      if (obj.players.white.hasOwnProperty('aiLevel') 
       || obj.players.black.hasOwnProperty('aiLevel')) return;

      const white = obj.players.white.user.id;
      const black = obj.players.black.user.id;

      const userColor = white == user ? 'white' : 'black';
      const opponentId = white == user ? black : white;
      
      const result = obj.status == 'draw'
        ? obj.status
        : obj.winner == userColor
        ? 'win'
        : 'loss';
      
      if (tracker.hasOwnProperty(opponentId)) {
        if (result == 'win') tracker[opponentId].win++;
        if (result == 'loss') tracker[opponentId].loss++;
        if (result == 'draw') tracker[opponentId].draw++;
      }else{
        tracker[opponentId] = {
          win: result == 'win' ? 1 : 0,
          loss: result == 'loss' ? 1 : 0,
          draw: result == 'draw' ? 1 : 0,
        }
      }
    }

    const onComplete = () => {
      return tracker;
    }

    return stream
    .then(readStream(onMessage))
    .then(onComplete);
}

function streamUsers(body, token) {

  const postheader = {
    method: 'POST', 
    body: body,
    headers: { 
      'Content-Type': 'text/plain',
      Authorization: 'Bearer ' + token
    },
  };
  
  const res = fetch('https://lichess.org/api/users', postheader)
  .then(res => res.json())
  .catch(err => console.log(err));

  return res;
}

/* FOR NODEJS
Utility function to read a ND-JSON HTTP stream.
`processLine` is a function taking a JSON object. It will be called with each element of the stream.
`response` is the result of a `fetch` request.
See usage example in the next file.
*/
const readStream = processLine => response => {
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf = '';
    return new Promise((resolve, fail) => {
      response.body.on('data', v => {
        const chunk = decoder.decode(v, { stream: true });
        buf += chunk;
  
        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
      });
      response.body.on('end', () => {
        if (buf.length > 0) processLine(JSON.parse(buf));
        resolve();
      });
      response.body.on('error', fail);
    });
  };

module.exports = {
    streamGames,
    streamUsers
  }
