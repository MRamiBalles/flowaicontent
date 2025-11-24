# Discord Bot - FlowAI Video Generator
# Allows users to generate videos directly from Discord

import discord
from discord import app_commands
import aiohttp
import os
from typing import Optional

# Bot configuration
DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
API_URL = os.getenv("FLOWAI_API_URL", "https://api.flowai.com/v1")

# Create bot instance
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)

# Available styles
STYLES = [
    "anime", "cyberpunk", "cinematic", "watercolor", 
    "oil_painting", "sketch", "3d_render", "pixel_art"
]

@tree.command(name="generate", description="Generate an AI video from a prompt")
@app_commands.describe(
    prompt="Describe the video you want to generate",
    style="Visual style for the video",
    duration="Video duration in seconds (3-10)"
)
async def generate(
    interaction: discord.Interaction,
    prompt: str,
    style: Optional[str] = "cinematic",
    duration: Optional[int] = 5
):
    """Generate a video from Discord"""
    
    # Defer response (generation takes time)
    await interaction.response.defer(thinking=True)
    
    # Validate inputs
    if style not in STYLES:
        await interaction.followup.send(f"❌ Invalid style. Choose from: {', '.join(STYLES)}")
        return
    
    if duration < 3 or duration > 10:
        await interaction.followup.send("❌ Duration must be between 3-10 seconds")
        return
    
    # Get user's FlowAI account (linked via OAuth)
    user_id = str(interaction.user.id)
    
    try:
        # Call FlowAI API
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_URL}/generate",
                json={
                    "prompt": prompt,
                    "style": style,
                    "duration": duration,
                    "discord_user_id": user_id
                },
                headers={
                    "Authorization": f"Bearer {os.getenv('DISCORD_BOT_API_KEY')}"
                }
            ) as response:
                if response.status == 429:
                    # Rate limited
                    data = await response.json()
                    await interaction.followup.send(
                        f"⏱️ Rate limit reached!\n"
                        f"Free users: 1 gen/hour\n"
                        f"Upgrade to PRO for unlimited: https://flowai.com/pricing"
                    )
                    return
                
                if response.status != 200:
                    error_data = await response.json()
                    await interaction.followup.send(f"❌ Generation failed: {error_data.get('detail', 'Unknown error')}")
                    return
                
                result = await response.json()
                video_url = result["video_url"]
                generation_id = result["id"]
        
        # Create embed with result
        embed = discord.Embed(
            title="🎬 Video Generated!",
            description=f"**Prompt:** {prompt}\n**Style:** {style}",
            color=discord.Color.green()
        )
        embed.set_image(url=video_url)
        embed.add_field(name="Duration", value=f"{duration}s", inline=True)
        embed.add_field(name="Generation ID", value=generation_id[:8], inline=True)
        embed.set_footer(text="Made with FlowAI • flowai.com")
        
        # Add watermark notice for free users
        user_tier = result.get("user_tier", "free")
        if user_tier == "free":
            embed.add_field(
                name="💎 Upgrade to PRO",
                value="Remove watermark & get unlimited generations!",
                inline=False
            )
        
        await interaction.followup.send(embed=embed)
        
        # Track usage for analytics
        await track_discord_generation(user_id, generation_id, interaction.guild_id)
        
    except Exception as e:
        await interaction.followup.send(f"❌ Error: {str(e)}")

@tree.command(name="link-account", description="Link your FlowAI account to Discord")
async def link_account(interaction: discord.Interaction):
    """Generate OAuth link to connect FlowAI account"""
    
    user_id = str(interaction.user.id)
    
    # Generate OAuth URL
    oauth_url = f"https://flowai.com/auth/discord?discord_id={user_id}"
    
    embed = discord.Embed(
        title="🔗 Link Your FlowAI Account",
        description="Click the link below to connect your Discord to FlowAI",
        color=discord.Color.blue()
    )
    embed.add_field(
        name="Why link?",
        value="• Track your generations\n• Unlock PRO features\n• Earn tokens\n• Sync progress",
        inline=False
    )
    
    # Create button
    view = discord.ui.View()
    button = discord.ui.Button(label="Link Account", url=oauth_url, style=discord.ButtonStyle.link)
    view.add_item(button)
    
    await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

@tree.command(name="styles", description="View all available video styles")
async def styles(interaction: discord.Interaction):
    """Show available styles"""
    
    embed = discord.Embed(
        title="🎨 Available Styles",
        description="Choose from these visual styles for your videos",
        color=discord.Color.purple()
    )
    
    for style in STYLES:
        embed.add_field(name=style.replace("_", " ").title(), value=f"`{style}`", inline=True)
    
    embed.set_footer(text="Use /generate prompt:your_idea style:anime")
    
    await interaction.response.send_message(embed=embed)

@tree.command(name="stats", description="View your FlowAI stats")
async def stats(interaction: discord.Interaction):
    """Get user's generation stats"""
    
    user_id = str(interaction.user.id)
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_URL}/users/{user_id}/stats",
                headers={"Authorization": f"Bearer {os.getenv('DISCORD_BOT_API_KEY')}"}
            ) as response:
                if response.status == 404:
                    await interaction.response.send_message(
                        "❌ Account not linked. Use `/link-account` first!",
                        ephemeral=True
                    )
                    return
                
                data = await response.json()
        
        embed = discord.Embed(
            title=f"📊 Stats for {interaction.user.name}",
            color=discord.Color.gold()
        )
        embed.add_field(name="Total Generations", value=data.get("total_generations", 0), inline=True)
        embed.add_field(name="Tier", value=data.get("tier", "free").upper(), inline=True)
        embed.add_field(name="Tokens", value=data.get("tokens_balance", 0), inline=True)
        embed.add_field(name="Remaining Today", value=data.get("remaining_generations", "?"), inline=True)
        
        await interaction.response.send_message(embed=embed)
        
    except Exception as e:
        await interaction.response.send_message(f"❌ Error fetching stats: {str(e)}", ephemeral=True)

async def track_discord_generation(discord_user_id: str, generation_id: str, guild_id: Optional[int]):
    """Track generation for analytics"""
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{API_URL}/analytics/discord-generation",
                json={
                    "discord_user_id": discord_user_id,
                    "generation_id": generation_id,
                    "guild_id": str(guild_id) if guild_id else None
                },
                headers={"Authorization": f"Bearer {os.getenv('DISCORD_BOT_API_KEY')}"}
            )
    except:
        pass  # Silent fail for analytics

@client.event
async def on_ready():
    """Bot startup"""
    await tree.sync()
    print(f"✅ FlowAI Bot logged in as {client.user}")
    print(f"📊 Active in {len(client.guilds)} servers")

# Run bot
if __name__ == "__main__":
    if not DISCORD_TOKEN:
        raise ValueError("DISCORD_BOT_TOKEN environment variable required")
    
    client.run(DISCORD_TOKEN)
