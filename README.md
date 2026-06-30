# Gator for TypeScript🐊

Gator is a command-line blog aggregator. It fetches RSS feeds from around the web, stores the posts in a PostgreSQL database, and lets you browse them right from your terminal. It's multi-user (in a friendly, no-real-auth, "single machine" sort of way), so different users can follow different feeds and each get their own personalized reading list.

## What you'll need

Before you can run Gator, make sure you have these installed:

- **Node.js** (v22 or newer) — Gator is written in TypeScript and run with `tsx`.
- **PostgreSQL** (v16 or newer) — this is where all the feeds and posts get stored.

If you don't have them yet, on macOS the quickest path is Homebrew:

```bash
brew install node
brew install postgresql@16
brew services start postgresql@16
```

## Getting set up

**1. Clone the repo and install dependencies.**

```bash
git clone https://github.com/ankamason/blog-aggregator-ts.git
cd blog-aggregator-ts
npm install
```

**2. Create your PostgreSQL database.**

Hop into psql and create a database called `gator`:

```bash
psql postgres
```

```sql
CREATE DATABASE gator;
\q
```

**3. Create the config file.**

Gator looks for a config file in your home directory called `.gatorconfig.json`. This is where it keeps your database connection string and remembers who's currently logged in.

Create the file at `~/.gatorconfig.json` with this content (swap in your own Postgres connection details):

```json
{
  "db_url": "postgres://username:password@localhost:5432/gator?sslmode=disable"
}
```

On a typical macOS Homebrew setup with no password, that looks like:

```json
{
  "db_url": "postgres://yourname:@localhost:5432/gator?sslmode=disable"
}
```

Don't worry about adding a user — Gator fills that in for you once you register or log in.

**4. Run the database migrations.**

This sets up all the tables Gator needs:

```bash
npm run migrate
```

You're ready to go!

## Running Gator

Every command is run through `npm run start`, followed by the command name and any arguments:

```bash
npm run start <command> [args...]
```

## A tour of the commands

Here are some of the things you can do:

**Register a new user** (this also logs you in):

```bash
npm run start register lane
```

**Log in as an existing user:**

```bash
npm run start login lane
```

**Add a feed** (you'll automatically start following any feed you add):

```bash
npm run start addfeed "TechCrunch" "https://techcrunch.com/feed/"
```

**Follow a feed someone else already added:**

```bash
npm run start follow "https://news.ycombinator.com/rss"
```

**See what you're following:**

```bash
npm run start following
```

**Start the aggregator.** This is a long-running process that fetches your feeds on a loop and saves new posts to the database. Give it a duration that tells it how often to fetch — and please be gentle with the servers you're pulling from (something like `1m` is polite). Leave it running in one terminal while you use Gator in another, and press `Ctrl+C` when you want to stop it.

```bash
npm run start agg 1m
```

**Browse your posts.** Once the aggregator has collected some posts, this shows you the latest ones from the feeds you follow. It takes an optional limit (defaults to 2):

```bash
npm run start browse 5
```

**A few more handy commands:**

- `npm run start users` — list all users, with a marker next to whoever's logged in
- `npm run start feeds` — list every feed in the database and who added it
- `npm run start unfollow "<url>"` — stop following a feed
- `npm run start reset` — wipe the database back to a clean slate (handy for testing)

## How it all fits together

The typical flow is: **register** a user, **addfeed** (or **follow**) some feeds you like, leave **agg** running for a bit to collect posts, then **browse** to read what came in. Happy aggregating!