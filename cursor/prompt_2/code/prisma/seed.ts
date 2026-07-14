import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  const editor = await prisma.user.upsert({
    where: { email: "editor@bloghub.com" },
    update: {},
    create: {
      email: "editor@bloghub.com",
      password: await bcrypt.hash("editor123", 12),
      name: "Editor Principal",
      role: "EDITOR",
      apiToken: nanoid(32),
    },
  });

  const author = await prisma.user.upsert({
    where: { email: "autor@bloghub.com" },
    update: {},
    create: {
      email: "autor@bloghub.com",
      password: await bcrypt.hash("autor123", 12),
      name: "María García",
      role: "AUTHOR",
      apiToken: nanoid(32),
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: "lector@bloghub.com" },
    update: {},
    create: {
      email: "lector@bloghub.com",
      password: await bcrypt.hash("lector123", 12),
      name: "Carlos López",
      role: "READER",
      apiToken: nanoid(32),
    },
  });

  const tagTech = await prisma.tag.upsert({
    where: { name: "tecnología" },
    update: {},
    create: { name: "tecnología" },
  });

  const tagWeb = await prisma.tag.upsert({
    where: { name: "desarrollo-web" },
    update: {},
    create: { name: "desarrollo-web" },
  });

  const published = await prisma.article.upsert({
    where: { id: "seed-published-1" },
    update: {},
    create: {
      id: "seed-published-1",
      title: "Bienvenidos a BlogHub",
      content: `<h2>¿Qué es BlogHub?</h2><p>BlogHub es una plataforma de blog <strong>multi-autor</strong> con roles diferenciados, editor de texto enriquecido y API pública.</p><p>Los autores pueden crear artículos, enviarlos a revisión y los editores los publican.</p><ul><li>Lectores pueden leer y comentar</li><li>Autores crean contenido</li><li>Editores gestionan la publicación</li></ul>`,
      status: "PUBLISHED",
      authorId: author.id,
      publishedAt: new Date(),
      tags: {
        create: [
          { tagId: tagTech.id },
          { tagId: tagWeb.id },
        ],
      },
    },
  });

  await prisma.article.upsert({
    where: { id: "seed-draft-1" },
    update: {},
    create: {
      id: "seed-draft-1",
      title: "Artículo en borrador (solo visible para autor y editores)",
      content: "<p>Este artículo está en estado borrador y no es visible para el público.</p>",
      status: "DRAFT",
      authorId: author.id,
      tags: {
        create: [{ tagId: tagTech.id }],
      },
    },
  });

  await prisma.comment.upsert({
    where: { id: "seed-comment-1" },
    update: {},
    create: {
      id: "seed-comment-1",
      content: "¡Excelente plataforma! Me encanta el diseño **limpio** y *moderno*.",
      articleId: published.id,
      userId: reader.id,
    },
  });

  console.log("Seed completado:");
  console.log(`  Editor: editor@bloghub.com / editor123`);
  console.log(`  Autor:  autor@bloghub.com / autor123`);
  console.log(`  Lector: lector@bloghub.com / lector123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
