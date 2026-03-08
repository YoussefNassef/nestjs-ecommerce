import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { Category } from 'src/categories/category.entity';
import { Coupon } from 'src/coupons/coupon.entity';
import { CouponDiscountType } from 'src/coupons/enums/coupon-discount-type.enum';
import { Product } from 'src/products/products.entity';
import { Role } from 'src/auth/enums/role.enum';
import { User } from 'src/users/user.entity';
import { Address } from 'src/addresses/address.entity';

function loadEnvFile(fileName: string): void {
  const filePath = join(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

async function seed(): Promise<void> {
  loadEnvFile('.env.development');
  loadEnvFile('.env');

  const dataSource = new DataSource({
    type: 'postgres',
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    username: requireEnv('DB_USERNAME'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    entities: [join(process.cwd(), 'src/**/*.entity.{ts,js}')],
    synchronize: false,
  });

  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const couponRepo = dataSource.getRepository(Coupon);
  const userRepo = dataSource.getRepository(User);
  const addressRepo = dataSource.getRepository(Address);

  const categories = [
    {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Latest smartphones and accessories.',
      isActive: true,
    },
    {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Powerful laptops for work and gaming.',
      isActive: true,
    },
    {
      name: 'Audio',
      slug: 'audio',
      description: 'Headphones, earbuds, and speakers.',
      isActive: true,
    },
  ] satisfies Array<Partial<Category>>;

  await categoryRepo.upsert(categories, ['slug']);

  const storedCategories = await categoryRepo.find();
  const categoryBySlug = new Map(storedCategories.map((c) => [c.slug, c]));

  const legacySeedSkus = [
    'IP15P-256-BLK',
    'SGS25-256-GRY',
    'MBA-M4-13-SLV',
    'ROG-G16-I9',
    'AIRPODS-PRO2',
    'SONY-XM6-BLK',
    ...Array.from(
      { length: 20 },
      (_, i) => `SEED-${String(i + 1).padStart(3, '0')}`,
    ),
  ];

  await productRepo.delete(legacySeedSkus.map((sku) => ({ sku })));

  const products = [
    {
      name: 'Apple iPhone 16 Pro 256GB',
      slug: 'apple-iphone-16-pro-256gb',
      sku: 'APL-IP16P-256',
      price: 5199,
      stock: 25,
      isActive: true,
      description: 'A18 Pro chip, titanium body, and advanced camera system.',
      mainPicture: 'https://picsum.photos/seed/apl-ip16p-256-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/apl-ip16p-256-1/1200/800',
        'https://picsum.photos/seed/apl-ip16p-256-2/1200/800',
        'https://picsum.photos/seed/apl-ip16p-256-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Apple iPhone 16 128GB',
      slug: 'apple-iphone-16-128gb',
      sku: 'APL-IP16-128',
      price: 3899,
      stock: 35,
      isActive: true,
      description: 'Balanced flagship performance with all-day battery.',
      mainPicture: 'https://picsum.photos/seed/apl-ip16-128-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/apl-ip16-128-1/1200/800',
        'https://picsum.photos/seed/apl-ip16-128-2/1200/800',
        'https://picsum.photos/seed/apl-ip16-128-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Samsung Galaxy S25 Ultra 512GB',
      slug: 'samsung-galaxy-s25-ultra-512gb',
      sku: 'SMS-S25U-512',
      price: 5499,
      stock: 20,
      isActive: true,
      description: 'Large AMOLED display with flagship camera zoom.',
      mainPicture: 'https://picsum.photos/seed/sms-s25u-512-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/sms-s25u-512-1/1200/800',
        'https://picsum.photos/seed/sms-s25u-512-2/1200/800',
        'https://picsum.photos/seed/sms-s25u-512-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Samsung Galaxy S25 256GB',
      slug: 'samsung-galaxy-s25-256gb',
      sku: 'SMS-S25-256',
      price: 4199,
      stock: 30,
      isActive: true,
      description: 'High-end Android phone with premium build quality.',
      mainPicture: 'https://picsum.photos/seed/sms-s25-256-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/sms-s25-256-1/1200/800',
        'https://picsum.photos/seed/sms-s25-256-2/1200/800',
        'https://picsum.photos/seed/sms-s25-256-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Google Pixel 9 Pro 256GB',
      slug: 'google-pixel-9-pro-256gb',
      sku: 'GGL-PIX9P-256',
      price: 3999,
      stock: 18,
      isActive: true,
      description: 'Pixel camera intelligence with clean Android experience.',
      mainPicture: 'https://picsum.photos/seed/ggl-pix9p-256-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/ggl-pix9p-256-1/1200/800',
        'https://picsum.photos/seed/ggl-pix9p-256-2/1200/800',
        'https://picsum.photos/seed/ggl-pix9p-256-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Xiaomi 15 Pro 512GB',
      slug: 'xiaomi-15-pro-512gb',
      sku: 'XMI-15P-512',
      price: 3499,
      stock: 22,
      isActive: true,
      description: 'Fast charging and top-tier Snapdragon performance.',
      mainPicture: 'https://picsum.photos/seed/xmi-15p-512-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/xmi-15p-512-1/1200/800',
        'https://picsum.photos/seed/xmi-15p-512-2/1200/800',
        'https://picsum.photos/seed/xmi-15p-512-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'OnePlus 13 256GB',
      slug: 'oneplus-13-256gb',
      sku: 'ONP-13-256',
      price: 2999,
      stock: 26,
      isActive: true,
      description: 'Smooth flagship display and rapid wired charging.',
      mainPicture: 'https://picsum.photos/seed/onp-13-256-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/onp-13-256-1/1200/800',
        'https://picsum.photos/seed/onp-13-256-2/1200/800',
        'https://picsum.photos/seed/onp-13-256-3/1200/800',
      ],
      categorySlug: 'smartphones',
    },
    {
      name: 'Apple MacBook Air M4 13-inch',
      slug: 'apple-macbook-air-m4-13-inch',
      sku: 'APL-MBA-M4-13',
      price: 5499,
      stock: 12,
      isActive: true,
      description: 'Portable laptop ideal for daily productivity and study.',
      mainPicture: 'https://picsum.photos/seed/apl-mba-m4-13-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/apl-mba-m4-13-1/1200/800',
        'https://picsum.photos/seed/apl-mba-m4-13-2/1200/800',
        'https://picsum.photos/seed/apl-mba-m4-13-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Apple MacBook Pro M4 14-inch',
      slug: 'apple-macbook-pro-m4-14-inch',
      sku: 'APL-MBP-M4-14',
      price: 8299,
      stock: 9,
      isActive: true,
      description: 'Pro-grade laptop for developers and creators.',
      mainPicture: 'https://picsum.photos/seed/apl-mbp-m4-14-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/apl-mbp-m4-14-1/1200/800',
        'https://picsum.photos/seed/apl-mbp-m4-14-2/1200/800',
        'https://picsum.photos/seed/apl-mbp-m4-14-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Dell XPS 14',
      slug: 'dell-xps-14',
      sku: 'DEL-XPS14',
      price: 7499,
      stock: 11,
      isActive: true,
      description: 'Premium Windows laptop with OLED display option.',
      mainPicture: 'https://picsum.photos/seed/del-xps14-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/del-xps14-1/1200/800',
        'https://picsum.photos/seed/del-xps14-2/1200/800',
        'https://picsum.photos/seed/del-xps14-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'HP Spectre x360 14',
      slug: 'hp-spectre-x360-14',
      sku: 'HPP-SPX360-14',
      price: 6899,
      stock: 10,
      isActive: true,
      description: 'Convertible touchscreen laptop for business users.',
      mainPicture: 'https://picsum.photos/seed/hpp-spx360-14-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/hpp-spx360-14-1/1200/800',
        'https://picsum.photos/seed/hpp-spx360-14-2/1200/800',
        'https://picsum.photos/seed/hpp-spx360-14-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Lenovo Legion 5i',
      slug: 'lenovo-legion-5i',
      sku: 'LNV-LGN5I',
      price: 5999,
      stock: 15,
      isActive: true,
      description: 'Gaming laptop with strong cooling and RTX graphics.',
      mainPicture: 'https://picsum.photos/seed/lnv-lgn5i-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/lnv-lgn5i-1/1200/800',
        'https://picsum.photos/seed/lnv-lgn5i-2/1200/800',
        'https://picsum.photos/seed/lnv-lgn5i-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'ASUS ROG Strix G16',
      slug: 'asus-rog-strix-g16-2026',
      sku: 'ASS-ROG-G16',
      price: 7099,
      stock: 8,
      isActive: true,
      description: 'High-refresh gaming panel with Intel Core i9 CPU.',
      mainPicture: 'https://picsum.photos/seed/ass-rog-g16-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/ass-rog-g16-1/1200/800',
        'https://picsum.photos/seed/ass-rog-g16-2/1200/800',
        'https://picsum.photos/seed/ass-rog-g16-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Acer Swift Go 14',
      slug: 'acer-swift-go-14',
      sku: 'ACR-SWG14',
      price: 3699,
      stock: 17,
      isActive: true,
      description: 'Lightweight everyday laptop with long battery life.',
      mainPicture: 'https://picsum.photos/seed/acr-swg14-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/acr-swg14-1/1200/800',
        'https://picsum.photos/seed/acr-swg14-2/1200/800',
        'https://picsum.photos/seed/acr-swg14-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Microsoft Surface Laptop 7',
      slug: 'microsoft-surface-laptop-7',
      sku: 'MSF-SL7',
      price: 6399,
      stock: 10,
      isActive: true,
      description: 'Premium keyboard and display for office productivity.',
      mainPicture: 'https://picsum.photos/seed/msf-sl7-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/msf-sl7-1/1200/800',
        'https://picsum.photos/seed/msf-sl7-2/1200/800',
        'https://picsum.photos/seed/msf-sl7-3/1200/800',
      ],
      categorySlug: 'laptops',
    },
    {
      name: 'Apple AirPods Pro 2 USB-C',
      slug: 'apple-airpods-pro-2-usb-c',
      sku: 'APL-APP2-USBC',
      price: 949,
      stock: 45,
      isActive: true,
      description: 'Adaptive audio and strong ANC in compact earbuds.',
      mainPicture: 'https://picsum.photos/seed/apl-app2-usbc-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/apl-app2-usbc-1/1200/800',
        'https://picsum.photos/seed/apl-app2-usbc-2/1200/800',
        'https://picsum.photos/seed/apl-app2-usbc-3/1200/800',
      ],
      categorySlug: 'audio',
    },
    {
      name: 'Sony WH-1000XM6',
      slug: 'sony-wh-1000xm6-2026',
      sku: 'SNY-WH1000XM6',
      price: 1499,
      stock: 25,
      isActive: true,
      description: 'Industry-leading noise cancellation over-ear headset.',
      mainPicture: 'https://picsum.photos/seed/sny-wh1000xm6-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/sny-wh1000xm6-1/1200/800',
        'https://picsum.photos/seed/sny-wh1000xm6-2/1200/800',
        'https://picsum.photos/seed/sny-wh1000xm6-3/1200/800',
      ],
      categorySlug: 'audio',
    },
    {
      name: 'Bose QuietComfort Ultra',
      slug: 'bose-quietcomfort-ultra',
      sku: 'BOS-QCU',
      price: 1599,
      stock: 16,
      isActive: true,
      description: 'Comfort-focused premium headset with rich sound profile.',
      mainPicture: 'https://picsum.photos/seed/bos-qcu-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/bos-qcu-1/1200/800',
        'https://picsum.photos/seed/bos-qcu-2/1200/800',
        'https://picsum.photos/seed/bos-qcu-3/1200/800',
      ],
      categorySlug: 'audio',
    },
    {
      name: 'JBL Charge 6 Speaker',
      slug: 'jbl-charge-6-speaker',
      sku: 'JBL-CHG6',
      price: 799,
      stock: 40,
      isActive: true,
      description: 'Portable Bluetooth speaker with long battery runtime.',
      mainPicture: 'https://picsum.photos/seed/jbl-chg6-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/jbl-chg6-1/1200/800',
        'https://picsum.photos/seed/jbl-chg6-2/1200/800',
        'https://picsum.photos/seed/jbl-chg6-3/1200/800',
      ],
      categorySlug: 'audio',
    },
    {
      name: 'Samsung Galaxy Buds 3 Pro',
      slug: 'samsung-galaxy-buds-3-pro',
      sku: 'SMS-GB3P',
      price: 699,
      stock: 38,
      isActive: true,
      description: 'Compact earbuds optimized for Galaxy ecosystem.',
      mainPicture: 'https://picsum.photos/seed/sms-gb3p-main/1200/800',
      subPictures: [
        'https://picsum.photos/seed/sms-gb3p-1/1200/800',
        'https://picsum.photos/seed/sms-gb3p-2/1200/800',
        'https://picsum.photos/seed/sms-gb3p-3/1200/800',
      ],
      categorySlug: 'audio',
    },
  ];

  await productRepo.upsert(
    products.map((product) => {
      const { categorySlug, ...rest } = product;
      return {
        ...rest,
        categoryId: categoryBySlug.get(categorySlug)?.id,
      };
    }),
    ['sku'],
  );

  const now = new Date();
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: CouponDiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 200,
      maxDiscountAmount: 250,
      startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      code: 'SHIPFREE',
      discountType: CouponDiscountType.FIXED,
      discountValue: 30,
      minOrderAmount: 300,
      maxDiscountAmount: null,
      startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ] satisfies Array<Partial<Coupon>>;

  await couponRepo.upsert(coupons, ['code']);

  await userRepo.upsert(
    [
      {
        fullName: 'Store Admin',
        phone: '966500000001',
        isVerified: true,
        role: Role.ADMIN,
      },
      {
        fullName: 'Seed Customer',
        phone: '966500000002',
        isVerified: true,
        role: Role.USER,
      },
    ] satisfies Array<Partial<User>>,
    ['phone'],
  );

  const seedCustomer = await userRepo.findOneByOrFail({
    phone: '966500000002',
  });

  const existingDefaultAddress = await addressRepo.findOne({
    where: {
      user: { id: seedCustomer.id },
      label: 'Home',
    },
    relations: { user: true },
  });

  if (!existingDefaultAddress) {
    const address = addressRepo.create({
      user: seedCustomer,
      label: 'Home',
      recipientName: seedCustomer.fullName,
      phone: seedCustomer.phone,
      line1: 'King Fahd Rd, Building 10',
      line2: 'Apt 12',
      city: 'Riyadh',
      state: 'Riyadh',
      postalCode: '12345',
      country: 'SA',
      isDefault: true,
    });
    await addressRepo.save(address);
  }

  await dataSource.destroy();

  console.log('Seed completed successfully.');
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
