Algorand Community Discord Bot
==============================

Algorand discord bot for projects with community tokens. This bot contains the following slash commands

1) __balance__ - shows balance of token held in algorand wallet

2) __coinflip__ - Coinflip leaderboard to show users win and profit leaderboard 

3) __coinflip__ - Game where user bets N amount of tokens coinflip

4) __diceroll__ - Diceroll leaderboard to show users win and profit leaderboard 

5) __diceroll__ - Game where user bets on a diceroll. User and bot will both roll a N sided dice. Higher number from roll wins

6) __faucet__ - Gives amount range of tokens to a user from project reserve wallet

7) __flex__ - Flexes 1 random asset held by creator(Up to 3 creator wallets supported now)

8) __info__ - Shows user game stats for dice, coin & rps. Will display wins, loses, ties and profit/loss on all games

9) __lookup-user___ - Admin only command to lookup a registered user to get wallet address

10) __lookup-wallet__ - Admin only command to lookup a wallet address to find registered user

11) __ping__ - Ping bot to see if it is still running

12) __register__ - Allows a user to register their Algorand wallet address

13) __rps-leaderboard__ - Rock paper scissors leaderboard to show users win and profit leaderboard

14) __rps__ - Rock paper scissors game user can bet on

15) __send__ - Admin only command(restricted by user id) to send N amount of tokens to a registered user

16) __tip__ - Registered users can send other registered users X anount of tokens

17) __top-10-token-holders__ - Shows top 10 token holders that are registered 

Requirements:
------------

1) NODE JS v18.6.0
    https://nodejs.org/en/download/

2) MongoDB Cloud account
    https://www.mongodb.com/cloud/atlas/register
    https://www.mongodb.com/basics/mongodb-atlas-tutorial

3) A Algorand node to use. Purestake will work or any other provider
    https://developer.purestake.io/login

4) Discord application created
    https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot
    Make sure to set enable all Privileged Gateway Intents in bot section
    
5) Discord developer mode enabled on account to get IDs
    https://www.howtogeek.com/714348/how-to-enable-or-disable-developer-mode-on-discord/

6) Algorand token with clawback feature enabled

7) Another Algorand asset created to be used to verify that the user registering owns the wallet. Users will need to only opt into it and will never hold. A 1:1 asset will be fine.

8) Discord channel for all logs of token transaction created

Setup Instructions
------------------

1) Download or clone the latest version of the code

2) Navigate to where the code is and run `npm install`

3) Copy the `.env.tmp` file located in the root of the project and rename to `.env`

4) Fill in all the config variable in the `.env` file.
- Discord developer mode is required to be enabled to get role ids and channel ids.
- Min and max bets of all games can bee altered as well as add new gifs
- SEND_FROM_RESERVE_USERS accepts many ids seperated by spaces

To start the bot I recommend using NPM forever or PM2 for process manage to keep the script alive
- https://npmjs.com/package/forever
- https://pm2.keymetrics.io/
`forever start main.js` will start the bot
`forever list` will list all running processes
`forever stop PID` will stop the process for the give process id(PID)

Bot will currently download and cache all created assets for up to 3 creator address the first time the bot is started only

F.A.Q.
------

__Q:__ How do i adjust the command cooldown.
__A:__ To adjust edit the file of the command you want and change the cooldown variable value to time wanted. All time is in minutes `const cooldown = 90;` (90 min cooldown)

More Q&A to come!

Please read the license

How to contribute
-----------------
One way to contribute changes is to send a GitHub Pull Request.













Becareful who you trust! Watch out for thiefs and scammers!
