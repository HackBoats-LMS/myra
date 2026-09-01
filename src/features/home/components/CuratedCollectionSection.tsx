import { getCachedBrandStories } from "@/lib/cache";
import CuratedCollectionClient, { StoryItem } from "./CuratedCollectionClient";

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: "sarees",
    number: "01",
    subtitle: "Where Every Saree Becomes a Statement",
    title: "Curated for Every Celebration",
    description:
      "Discover a thoughtfully curated collection of silk, designer, and everyday sarees, along with elegant women's wear for every occasion. At Myra Shopping Mall, quality, craftsmanship, and timeless style come together to help you celebrate life's most beautiful moments.",
    image: "/displaypics/brandIdentity/1.png",
    alt: "Curated Sarees for Celebrations",
  },
  {
    id: "women",
    number: "02",
    subtitle: "Style Beyond Trends",
    title: "Fashion That Defines You",
    description:
      "Discover contemporary women's wear designed for confidence, comfort, and effortless style. From casual essentials to statement pieces, Myra Shopping Mall brings you the latest collections for every occasion.",
    image: "/displaypics/brandIdentity/2.png",
    alt: "Contemporary Women's Fashion",
  },
];

export default async function CuratedCollectionSection() {
  let dbStories: Awaited<ReturnType<typeof getCachedBrandStories>> = [];
  try {
    dbStories = await getCachedBrandStories();
  } catch (err) {
    console.warn("Failed to load cached brand stories in CuratedCollectionSection:", err);
  }

  const stories: StoryItem[] =
    dbStories.length > 0
      ? dbStories.map((story, index) => ({
          id: story.id,
          number: String(index + 1).padStart(2, "0"),
          subtitle: story.subtitle || "",
          title: story.title,
          description: story.description || "",
          image: story.imageUrl,
          alt: story.altText || story.title,
        }))
      : DEFAULT_STORIES;

  return <CuratedCollectionClient stories={stories} />;
}
