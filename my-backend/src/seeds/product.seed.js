"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const data_source_1 = require("../data-source");
const products_entity_1 = require("../products/products.entity");
const categories_entity_1 = require("../categories/categories.entity");
async function seed() {
    console.log('Before DB connect');
    await data_source_1.AppDataSource.initialize();
    console.log('DB connected');
    const productRepo = data_source_1.AppDataSource.getRepository(products_entity_1.Product);
    const categoryRepo = data_source_1.AppDataSource.getRepository(categories_entity_1.Category);
    console.log('Seeding...');
    const categories = [
        'Books',
        'Shoes',
        'Clothing',
        'Computers',
        'Phones',
        'Mouse',
        'Keyboard',
    ];
    for (const name of categories) {
        const exists = await categoryRepo.findOne({
            where: { name },
        });
        if (!exists) {
            await categoryRepo.save({ name });
            console.log(`Added category ${name}`);
        }
    }
    const books = await categoryRepo.findOne({
        where: { name: 'Books' },
    });
    const computers = await categoryRepo.findOne({
        where: { name: 'Computers' },
    });
    const phones = await categoryRepo.findOne({
        where: { name: 'Phones' },
    });
    const shoes = await categoryRepo.findOne({
        where: { name: 'Shoes' },
    });
    const mouse = await categoryRepo.findOne({
        where: { name: 'Mouse' },
    });
    const keyboard = await categoryRepo.findOne({
        where: { name: 'Keyboard' },
    });
    if (!books || !computers || !phones || !shoes || !mouse || !keyboard) {
        throw new Error('Missing categories');
    }
    const products = [
        {
            name: 'Clean Code',
            description: 'Programming book',
            price: 35,
            stock: 50,
            category: books,
        },
        {
            name: 'MacBook Pro',
            description: 'Apple laptop',
            price: 1999,
            stock: 10,
            category: computers,
        },
        {
            name: 'iPhone 15',
            description: 'Apple phone',
            price: 999,
            stock: 30,
            category: phones,
        },
    ];
    for (const p of products) {
        const exists = await productRepo.findOne({
            where: {
                name: p.name,
            },
        });
        if (!exists) {
            await productRepo.save(p);
            console.log(`Added ${p.name}`);
        }
    }
    console.log('Seed done');
    await data_source_1.AppDataSource.destroy();
    process.exit();
}
seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
