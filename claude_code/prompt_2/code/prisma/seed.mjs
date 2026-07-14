import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role, apiToken: nanoid(40) },
  });
}

async function upsertArticle({ title, content, excerpt, coverImage, status, authorId, tags, publishedAt }) {
  const slug = slugify(title);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.article.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      status,
      authorId,
      publishedAt: publishedAt ?? null,
      tags: { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
    },
  });
}

async function main() {
  const editor = await upsertUser({
    name: "Elena Editora",
    email: "editor@blog.test",
    password: "password123",
    role: "EDITOR",
  });
  const author = await upsertUser({
    name: "Antonio Autor",
    email: "autor@blog.test",
    password: "password123",
    role: "AUTHOR",
  });
  const author2 = await upsertUser({
    name: "Bea Bloguera",
    email: "autora2@blog.test",
    password: "password123",
    role: "AUTHOR",
  });
  const reader = await upsertUser({
    name: "Rita Lectora",
    email: "lector@blog.test",
    password: "password123",
    role: "READER",
  });

  const a1 = await upsertArticle({
    title: "Bienvenidos a Multiblog",
    excerpt: "Una plataforma de blog colaborativo con lectores, autores y editores.",
    content: `
      <h2>Un blog hecho por y para varios autores</h2>
      <p>Multiblog es un espacio donde <strong>varios autores</strong> pueden publicar artículos que pasan por un
      proceso de <em>revisión editorial</em> antes de llegar al público. Los lectores registrados pueden comentar
      los artículos publicados.</p>
      <blockquote><p>Escribe, envía a revisión y publica cuando esté listo.</p></blockquote>
      <ul>
        <li>Editor de texto enriquecido</li>
        <li>Imágenes desde URL</li>
        <li>Vista previa automática de enlaces externos</li>
      </ul>
    `,
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
    status: "PUBLISHED",
    authorId: editor.id,
    tags: ["anuncios", "multiblog"],
    publishedAt: new Date(),
  });

  const a2 = await upsertArticle({
    title: "Guía rápida de Markdown y formato enriquecido",
    excerpt: "Cómo dar formato a tus artículos con el editor de texto enriquecido.",
    content: `
      <p>El editor permite <strong>negrita</strong>, <em>cursiva</em>, <s>tachado</s> y también:</p>
      <h3>Listas numeradas</h3>
      <ol><li>Primero</li><li>Segundo</li><li>Tercero</li></ol>
      <p>También puedes insertar enlaces con vista previa automática, como este:</p>
      <div class="link-preview-card" data-url="https://nextjs.org" data-title="Next.js by Vercel - The React Framework" data-image="" data-site="nextjs.org">
        <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" class="link-preview-link">
          <div class="link-preview-body">
            <div class="link-preview-title">Next.js by Vercel - The React Framework</div>
            <div class="link-preview-site">nextjs.org</div>
          </div>
        </a>
      </div>
      <p>Y por supuesto, imágenes insertadas directamente desde una URL.</p>
    `,
    coverImage: null,
    status: "PUBLISHED",
    authorId: author.id,
    tags: ["tutorial", "escritura"],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  });

  const a3 = await upsertArticle({
    title: "Diez lugares para visitar este verano",
    excerpt: "Una selección de destinos para desconectar.",
    content: `<p>Un artículo sobre viajes, todavía en borrador. Iremos añadiendo destinos poco a poco.</p>`,
    coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
    status: "DRAFT",
    authorId: author.id,
    tags: ["viajes"],
  });

  const a4 = await upsertArticle({
    title: "Recetas rápidas para el día a día",
    excerpt: "Cocina saludable en menos de 30 minutos.",
    content: `<p>Este artículo está esperando revisión editorial antes de publicarse.</p><p>Incluye recetas vegetarianas y veganas fáciles de preparar.</p>`,
    coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
    status: "IN_REVIEW",
    authorId: author2.id,
    tags: ["cocina", "recetas"],
  });

  const a5 = await upsertArticle({
    title: "El futuro del trabajo remoto",
    excerpt: "Reflexiones sobre cómo cambia el trabajo a distancia.",
    content: `<p>El trabajo remoto sigue evolucionando. En este artículo publicado exploramos tendencias y herramientas.</p><h3>Herramientas clave</h3><ul><li>Videollamadas</li><li>Documentos colaborativos</li><li>Gestión de tareas asíncrona</li></ul>`,
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80",
    status: "PUBLISHED",
    authorId: author2.id,
    tags: ["trabajo", "tecnología"],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  });

  const existingComments = await prisma.comment.count();
  if (existingComments === 0) {
    await prisma.comment.createMany({
      data: [
        { content: "<p>¡Qué buena iniciativa, tiene muy buena pinta!</p>", articleId: a1.id, authorId: reader.id },
        { content: "<p>Gracias por la explicación, muy clara.</p>", articleId: a2.id, authorId: reader.id },
        { content: "<p>Totalmente de acuerdo, cada vez trabajo más así.</p>", articleId: a5.id, authorId: editor.id },
      ],
    });
  }

  console.log("Seed completado:");
  console.log(`  Editor: ${editor.email} / password123`);
  console.log(`  Autor:  ${author.email} / password123`);
  console.log(`  Autor2: ${author2.email} / password123`);
  console.log(`  Lector: ${reader.email} / password123`);
  console.log(`  Artículos creados/existentes: ${[a1, a2, a3, a4, a5].length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
