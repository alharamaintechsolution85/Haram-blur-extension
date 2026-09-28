import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const articles = {
  "haya-and-digital-presence": {
    title: "Haya: a practice of mindful presence",
    description: "A reflection on modesty, intention, and how we show up in digital spaces.",
    sections: [
      { heading: "What haya asks of us", paragraphs: ["Haya is often translated as modesty, but its meaning reaches beyond clothing or appearance. It is a quality of awareness: a sense of what is fitting, a care for dignity, and an attentiveness to the people around us.", "That awareness can shape ordinary decisions online too. We can pause before sharing, consider how a post may affect someone else, and choose not to linger over content that pulls us away from our values."] },
      { heading: "Intention in a crowded feed", paragraphs: ["Digital feeds are designed to keep attention moving. A mindful practice begins by noticing that pull without judging ourselves for it. Small choices, such as setting a stopping point or muting a distracting account, can make room for more deliberate use.", "These habits are personal, not a measure of anyone else's faith. The useful question is simply whether a choice brings more care, calm, and purpose to the day."] },
      { heading: "A gentle practice", paragraphs: ["Before opening an app, name what you came to do. When that purpose is complete, close the app and take a breath. If a reminder helps, choose one that feels supportive rather than punitive."] },
    ],
  },
  "guarding-the-gaze": {
    title: "Guarding the gaze in a connected world",
    description: "Practical, compassionate ways to set boundaries around attention online.",
    sections: [
      { heading: "A principle for everyday life", paragraphs: ["The Qur'an instructs believing men and women to lower their gaze and guard their chastity (An-Nur 24:30–31). In a digital setting, this guidance invites reflection on what we choose to look at and how we care for our attention.", "A reminder is not a replacement for personal judgment or religious learning. It can be one small support among many, alongside trusted teachers, family conversations, and habits that fit a person's circumstances."] },
      { heading: "Design boundaries that work", paragraphs: ["Try practical steps that reduce friction: unfollow sources that repeatedly disrupt your focus, move high-distraction apps off the home screen, and decide when you will check them. A content filter may also help, but it should be understandable, adjustable, and easy to turn off.", "No automated filter can reliably interpret every image or context. Treat tools as imperfect aids rather than authorities, and review settings when they no longer serve you."] },
      { heading: "Pair boundaries with mercy", paragraphs: ["Habits change gradually. If a boundary slips, notice what happened and make the next choice with care. The goal is a more intentional relationship with technology, not shame."] },
    ],
  },
} as const;

type ArticleSlug = keyof typeof articles;

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug as ArticleSlug];
  return article ? { title: `${article.title} | Haram Blur`, description: article.description } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug as ArticleSlug];
  if (!article) notFound();

  return (
    <main className="article-page">
      <Link className="article-back" href="/">← Back to your space</Link>
      <article>
        <header className="article-header"><p className="eyebrow">Knowledge · Digital ethics</p><h1>{article.title}</h1><p className="article-deck">{article.description}</p></header>
        {article.sections.map((section) => <section className="article-section" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        <footer className="article-source"><h2>Further reflection</h2><h3>Qur’an, Surah An-Nur 24:30–31</h3><p>Translations vary. For deeper study and context, consult a trusted scholar or a reputable translation with commentary.</p></footer>
      </article>
    </main>
  );
}