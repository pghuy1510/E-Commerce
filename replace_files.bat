@echo off
cd /d "%CD%"
move /Y my-frontend\components\home\FeaturedProducts.tsx my-frontend\components\home\FeaturedProducts.tsx.bak
move /Y my-frontend\components\home\FeaturedProducts_new.tsx my-frontend\components\home\FeaturedProducts.tsx
move /Y my-frontend\components\home\TopSellingProducts.tsx my-frontend\components\home\TopSellingProducts.tsx.bak
move /Y my-frontend\components\home\TopSellingProducts_new.tsx my-frontend\components\home\TopSellingProducts.tsx
echo Done! Files replaced successfully.
