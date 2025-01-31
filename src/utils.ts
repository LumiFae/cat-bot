import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import axios from 'axios';
import { catImagesCache } from '../db/schema';

export async function cat_image(db: NodePgDatabase): Promise<string> {
    try {
        const response = await axios.get(
            'https://api.thecatapi.com/v1/images/search',
            {
                headers: { 'x-api-key': process.env.CAT_API_KEY },
            }
        );
        const newImageUrl: string = response.data[0].url;

        await db
            .insert(catImagesCache)
            .values({ url: newImageUrl })
            .onConflictDoNothing();

        return newImageUrl;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            type CacheResult = { url: string; id: number };
            let cacheResult: CacheResult[] | CacheResult = await db
                .select()
                .from(catImagesCache);
            cacheResult =
                cacheResult[Math.floor(Math.random() * cacheResult.length)];

            return cacheResult.url;
        } else {
            throw error;
        }
    }
}

export async function cat_fact(): Promise<string> {
    let fact: string = (await axios.get('https://catfact.ninja/fact')).data
        .fact;
    if (fact.toLowerCase().includes('fahrenheit')) {
        const factSplit = fact.split(' ');
        const index = factSplit.indexOf('fahrenheit');
        const fahrenheit = parseInt(factSplit[index - 2]);
        factSplit[index - 2] = Math.round(
            ((parseInt(factSplit[index - 2]) - 32) * 5) / 9
        ).toString();
        factSplit[index] =
            'Celsius' +
            `(${fahrenheit} degrees Fahrenheit)` +
            factSplit[index].endsWith('.')
                ? '.'
                : '' + factSplit[index].endsWith(',')
                ? ','
                : '';
        fact = factSplit.join(' ');
    }
    return fact;
}

export async function getBuffer(url: string) {
    return await axios
        .get(url, {
            responseType: 'arraybuffer',
        })
        .then((response) => Buffer.from(response.data));
}
