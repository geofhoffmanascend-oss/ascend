import prisma from '../lib/database'

const PHOTOS = [
  { url: 'https://images.pexels.com/photos/15545735/pexels-photo-15545735.jpeg?auto=compress&cs=tinysrgb&w=1200', caption: 'Competition match' },
  { url: 'https://images.pexels.com/photos/15545734/pexels-photo-15545734.jpeg?auto=compress&cs=tinysrgb&w=1200', caption: 'Drilling takedowns', forSale: true, price: 999 },
  { url: 'https://images.pexels.com/photos/8612032/pexels-photo-8612032.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Guard passing' },
  { url: 'https://images.pexels.com/photos/8612528/pexels-photo-8612528.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Rolling session' },
  { url: 'https://images.pexels.com/photos/8612009/pexels-photo-8612009.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Sparring partners', forSale: true, price: 1499 },
  { url: 'https://images.pexels.com/photos/7988953/pexels-photo-7988953.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Youth class — Tuesday night' },
  { url: 'https://images.pexels.com/photos/7988954/pexels-photo-7988954.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Youth training' },
  { url: 'https://images.pexels.com/photos/7988778/pexels-photo-7988778.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Kids on the mat' },
  { url: 'https://images.pexels.com/photos/8611373/pexels-photo-8611373.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Open mat night' },
  { url: 'https://images.pexels.com/photos/7988379/pexels-photo-7988379.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Technique drilling' },
  { url: 'https://images.pexels.com/photos/7988774/pexels-photo-7988774.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'Groundwork' },
  { url: 'https://images.pexels.com/photos/7988961/pexels-photo-7988961.jpeg?auto=compress&cs=tinysrgb&w=1200',  caption: 'End of class — great work tonight' },
]

async function main() {
  const admin = await prisma.user.findFirst({ where: { roles: { has: 'admin' } }, select: { id: true, name: true } })
  if (!admin) { console.error('No admin user found — run main seed first'); process.exit(1) }

  console.log(`Seeding gallery as ${admin.name}…`)

  // Remove existing test media
  await prisma.mediaItem.deleteMany({ where: { uploaderId: admin.id } })

  for (const photo of PHOTOS) {
    await prisma.mediaItem.create({
      data: {
        uploaderId: admin.id,
        url:        photo.url,
        type:       'photo',
        caption:    photo.caption,
        forSale:    photo.forSale ?? false,
        price:      photo.price   ?? null,
      },
    })
  }

  console.log(`✓ Seeded ${PHOTOS.length} photos`)
}

main().catch(console.error).finally(() => prisma.$disconnect?.())
