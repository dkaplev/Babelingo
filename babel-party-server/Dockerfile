# Production image for Render / Fly.io / Railway / Cloud Run.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.mjs ./

ENV NODE_ENV=production
# Render/Fly set PORT; local default for `docker run -p 3847:3847 -e PORT=3847`
ENV PORT=3847
EXPOSE 3847

CMD ["node", "index.mjs"]
