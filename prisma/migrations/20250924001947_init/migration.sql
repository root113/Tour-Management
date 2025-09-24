-- CreateEnum
CREATE TYPE "public"."Genre" AS ENUM ('African Music', 'Blues', 'Classical Music', 'Country & Western', 'Electronica', 'Flamenco', 'Heavy Metal', 'Hip Hop', 'Jazz', 'Latin Music', 'Modern Rock', 'Pop', 'Punk Rock', 'Reggae', 'R&B', 'Rock', 'World Music');

-- CreateEnum
CREATE TYPE "public"."ConcertHour" AS ENUM ('12:00', '14:00', '16:00', '18:00', '20:00', '22:00');

-- CreateTable
CREATE TABLE "public"."PopYear" (
    "id" TEXT NOT NULL,
    "year" SMALLINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,

    CONSTRAINT "PopYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PopDay" (
    "id" TEXT NOT NULL,
    "day_index" SMALLINT NOT NULL,
    "real_date" DATE NOT NULL,
    "pop_year_id" TEXT NOT NULL,
    "event_id" TEXT,

    CONSTRAINT "PopDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."City" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(25) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Club" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "club_genre" "public"."Genre" NOT NULL,
    "city_id" TEXT NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Band" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "band_genre" "public"."Genre" NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Concert" (
    "id" TEXT NOT NULL,
    "concert_date" DATE NOT NULL,
    "concert_hour" "public"."ConcertHour" NOT NULL,
    "concert_genre" "public"."Genre" NOT NULL,
    "pop_day_id" TEXT NOT NULL,
    "club_id" TEXT NOT NULL,
    "band_id" TEXT NOT NULL,

    CONSTRAINT "Concert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_pop_year" ON "public"."PopYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "unique_pop_year_range" ON "public"."PopYear"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "unique_pop_day" ON "public"."PopDay"("day_index");

-- CreateIndex
CREATE UNIQUE INDEX "PopDay_real_date_key" ON "public"."PopDay"("real_date");

-- CreateIndex
CREATE UNIQUE INDEX "unique_pop_day_event" ON "public"."PopDay"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_city_name" ON "public"."City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_club_name" ON "public"."Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_band_name" ON "public"."Band"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_concert_entry" ON "public"."Concert"("concert_date", "concert_hour", "club_id");

-- CreateIndex
CREATE UNIQUE INDEX "Event_name_key" ON "public"."Event"("name");

-- AddForeignKey
ALTER TABLE "public"."PopDay" ADD CONSTRAINT "PopDay_pop_year_id_fkey" FOREIGN KEY ("pop_year_id") REFERENCES "public"."PopYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PopDay" ADD CONSTRAINT "PopDay_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Club" ADD CONSTRAINT "Club_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Concert" ADD CONSTRAINT "Concert_pop_day_id_fkey" FOREIGN KEY ("pop_day_id") REFERENCES "public"."PopDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Concert" ADD CONSTRAINT "Concert_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Concert" ADD CONSTRAINT "Concert_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "public"."Band"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
