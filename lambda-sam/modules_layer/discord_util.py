import os
from discordwebhook import Discord

DISCORD_URL = os.getenv("DISCORD_URL")

def send_discord(msg):
    discord = Discord(url=DISCORD_URL)
    discord.post(content=msg)