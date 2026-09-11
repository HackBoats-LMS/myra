import type { Prisma } from "@/generated/prisma";
import CuratedCollectionClient, { StoryItem } from "./CuratedCollectionClient";

type Banner = Prisma.BannerGetPayload<Record<string, unknown>>;
type BrandStory = Prisma.BrandStoryGetPayload<Record<string, unknown>>;

interface CuratedCollectionSectionProps {
  banners: Banner[];
  brandStories: BrandStory[];
}

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: "sarees",
    number: "01",
    subtitle: "Where Every Saree Becomes a Statement",
    title: "Curated for Every Celebration",
    description:
      "Discover a thoughtfully curated collection of silk, designer, and everyday sarees, along with elegant women's wear for every occasion. At Myra Shopping Mall, quality, craftsmanship, and timeless style come together to help you celebrate life's most beautiful moments.",
    image: "/displaypics/brandIdentity/1.png",
    fallbackImage: "/displaypics/brandIdentity/1.png",
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
    fallbackImage: "/displaypics/brandIdentity/2.png",
    alt: "Contemporary Women's Fashion",
  },
];

export default function CuratedCollectionSection({ banners, brandStories: dbStories }: CuratedCollectionSectionProps) {
  const story1Banner = banners.find((b) => b.slot === "curated_story_1");
  const story2Banner = banners.find((b) => b.slot === "curated_story_2");

  // Helper to pick the most up-to-date custom image (prioritizing custom uploads over default local assets)
  const resolveImage = (bannerImg?: string | null, storyImg?: string | null, defaultImg: string = "") => {
    if (bannerImg && !bannerImg.startsWith("/displaypics/")) return bannerImg;
    if (storyImg && !storyImg.startsWith("/displaypics/")) return storyImg;
    return bannerImg || storyImg || defaultImg;
  };

  const stories: StoryItem[] = [
    {
      id: "sarees",
      number: "01",
      subtitle: story1Banner?.subtitle || dbStories[0]?.subtitle || DEFAULT_STORIES[0].subtitle,
      title: story1Banner?.title || dbStories[0]?.title || DEFAULT_STORIES[0].title,
      description: story1Banner?.description || dbStories[0]?.description || DEFAULT_STORIES[0].description,
      image: resolveImage(story1Banner?.imageUrl, dbStories[0]?.imageUrl, DEFAULT_STORIES[0].image),
      fallbackImage: DEFAULT_STORIES[0].image,
      alt: story1Banner?.altText || story1Banner?.title || dbStories[0]?.altText || DEFAULT_STORIES[0].alt,
    },
    {
      id: "women",
      number: "02",
      subtitle: story2Banner?.subtitle || dbStories[1]?.subtitle || DEFAULT_STORIES[1].subtitle,
      title: story2Banner?.title || dbStories[1]?.title || DEFAULT_STORIES[1].title,
      description: story2Banner?.description || dbStories[1]?.description || DEFAULT_STORIES[1].description,
      image: resolveImage(story2Banner?.imageUrl, dbStories[1]?.imageUrl, DEFAULT_STORIES[1].image),
      fallbackImage: DEFAULT_STORIES[1].image,
      alt: story2Banner?.altText || story2Banner?.title || dbStories[1]?.altText || DEFAULT_STORIES[1].alt,
    },
  ];

  return <CuratedCollectionClient stories={stories} />;
}
