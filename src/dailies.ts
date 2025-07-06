import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { servers } from '../db/schema';
import {AttachmentBuilder, Client, TextChannel} from 'discord.js';
import axios from 'axios';
import 'dotenv/config';
import {cat_fact, cat_image, getBuffer} from './utils';

export async function daily(db: NodePgDatabase, client: Client) {
    const res = await db.select().from(servers);
    if (!res) return;
    const fact = await cat_fact();
    const image = await cat_image(db);
    const imageBuffer = await getBuffer(image)
    const attachment = new AttachmentBuilder(image);

    try {
        await client.user?.setAvatar(imageBuffer);
    } catch (error) {
        console.error('Failed to update avatar:', error);
    }
    for (const guildInfo of res) {
        let guild = client.guilds.cache.get(guildInfo.id);
        if (!guild)
            guild = await client.guilds.fetch(guildInfo.id).catch(() => null);
        if (!guild)
            continue;
        if (guildInfo.fact_channel && guildInfo.send_facts) {
            let fact_channel =
                guild.channels.cache.get(guildInfo.fact_channel)
            if (!fact_channel)
                fact_channel =
                    await guild.channels.fetch(
                        guildInfo.fact_channel
                    ).catch(() => null)
            if (!fact_channel)
                continue;
            if(!fact_channel.isTextBased)
                continue;
            await (fact_channel as TextChannel).send(`Today's cat fact:\n${fact}`);
        }
        if (guildInfo.photo_channel && guildInfo.send_photos) {
            let photo_channel =
                guild.channels.cache.get(guildInfo.photo_channel)
            if (!photo_channel)
                photo_channel =
                    await guild.channels.fetch(
                        guildInfo.photo_channel
                    ).catch(() => null)
            if (!photo_channel)
                continue;
            if (!photo_channel.isTextBased)
                continue;
            await (photo_channel as TextChannel).send({ files: [attachment] });
        }
    }
}
