import { join as joinPath } from 'node:path';

import createFastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';

export const initFastify = async ({
    apiKey,
    port,
    getData,
    setData
}) => {
    const fastify = createFastify();
    fastify.register(fastifyCors);
    fastify.register(
        fastifyStatic,
        {
            root: joinPath(process.cwd(), 'public'),
            prefix: '/',
            index: 'main.html'
        }
    );
    fastify.addHook(
        'onRequest',
        (
            request,
            reply,
            done
        ) => {
            if(request.url.startsWith('/api') && request.headers['authorization'] !== `Apikey ${apiKey}`)
                reply.code(401).send();
            done();
        }
    );
    fastify.post(
        '/api/schedule',
        async (
            request,
            reply
        ) => {
            const { schedule } = getData();
            schedule.push({
                ...request.body,
                id: Bun.randomUUIDv7()
            });
            await setData({ schedule });
            reply.code(201).send();
        }
    );
    fastify.get(
        '/api/schedule',
        async (
            request,
            reply
        ) => {
            reply.send(getData().schedule);
        }
    );
    fastify.patch(
        '/api/schedule/:id',
        async (
            request,
            reply
        ) => {
            const
                { schedule } = getData(),
                itemIndex = schedule.findIndex(item => item.id === request.params.id);
            Object.assign(schedule[itemIndex], request.body);
            await setData({ schedule });
            reply.code(204).send();
        }
    );
    fastify.delete(
        '/api/schedule/:id',
        async (
            request,
            reply
        ) => {
            const
                { schedule } = getData(),
                itemIndex = schedule.findIndex(item => item.id === request.params.id);
            schedule.splice(itemIndex, 1);
            await setData({ schedule });
            reply.code(204).send();
        }
    );
    await fastify.listen({
        port,
        host: '0.0.0.0'
    });
};