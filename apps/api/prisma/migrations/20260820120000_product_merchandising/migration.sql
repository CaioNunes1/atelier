ALTER TABLE "products" ADD COLUMN "is_exclusive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "is_ready_to_ship" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "product_variants" ADD COLUMN "image_url" TEXT;
