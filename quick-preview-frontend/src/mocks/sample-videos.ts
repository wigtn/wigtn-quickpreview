import { VideoAnalysis } from "@/types/analysis";

// Sample video analyses for demo purposes
export const sampleVideos: VideoAnalysis[] = [
  {
    id: "sample-1",
    videoId: "dQw4w9WgXcQ",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    channelName: "Rick Astley",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    publishedAt: "2009-10-25T00:00:00Z",
    duration: 213,
    viewCount: 1500000000,
    likeCount: 16000000,
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    summary:
      "The iconic 1987 music video that became an internet phenomenon.\nFeatures Rick Astley's signature dance moves and powerful vocals.\nA timeless classic that transcends generations.",
    watchScore: 9,
    watchScoreReason:
      "Cultural landmark with over 1.5 billion views. Essential internet history.",
    keywords: ["Music", "80s", "Pop", "Classic", "Meme", "Internet Culture"],
    highlights: [
      {
        timestamp: 0,
        title: "Intro",
        description: "The famous opening that started it all",
      },
      {
        timestamp: 43,
        title: "First Chorus",
        description: "Never gonna give you up, never gonna let you down",
      },
      {
        timestamp: 103,
        title: "Dance Break",
        description: "Iconic dance moves sequence",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    videoId: "jNQXAC9IVRw",
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    title: "Me at the zoo",
    channelName: "jawed",
    channelId: "UC4QobU6STFB0P71PMvOGN5A",
    publishedAt: "2005-04-23T00:00:00Z",
    duration: 19,
    viewCount: 300000000,
    likeCount: 13000000,
    thumbnailUrl: "https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    summary:
      "The first video ever uploaded to YouTube on April 23, 2005.\nYouTube co-founder Jawed Karim at the San Diego Zoo.\nA piece of internet history in just 19 seconds.",
    watchScore: 8,
    watchScoreReason:
      "Historical significance as YouTube's first video. Short but meaningful.",
    keywords: ["History", "YouTube", "First Video", "Zoo", "2005", "Internet"],
    highlights: [
      {
        timestamp: 0,
        title: "The Beginning",
        description: "Where YouTube started",
      },
      {
        timestamp: 10,
        title: "Elephants",
        description: "The cool thing about elephants",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    videoId: "9bZkp7q19f0",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE(강남스타일) M/V",
    channelName: "officialpsy",
    channelId: "UCrDkAvwZum-UTjHmzDI2iIw",
    publishedAt: "2012-07-15T00:00:00Z",
    duration: 253,
    viewCount: 5000000000,
    likeCount: 25000000,
    thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    summary:
      "The viral K-pop sensation that broke YouTube records in 2012.\nPSY's signature horse-riding dance became a global phenomenon.\nFirst video to reach 1 billion views on YouTube.",
    watchScore: 9,
    watchScoreReason:
      "Record-breaking cultural phenomenon. Entertaining and historically significant.",
    keywords: ["K-pop", "Dance", "Viral", "Korea", "Music", "2012"],
    highlights: [
      {
        timestamp: 0,
        title: "Opening",
        description: "Gangnam district scene",
      },
      {
        timestamp: 60,
        title: "Chorus",
        description: "Oppan Gangnam Style",
      },
      {
        timestamp: 120,
        title: "Elevator Scene",
        description: "Iconic elevator dance",
      },
      {
        timestamp: 180,
        title: "Horse Dance",
        description: "The famous horse-riding dance",
      },
    ],
    language: "ko",
    transcriptSource: "youtube",
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-4",
    videoId: "kJQP7kiw5Fk",
    url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    channelName: "Luis Fonsi",
    channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
    publishedAt: "2017-01-12T00:00:00Z",
    duration: 282,
    viewCount: 8300000000,
    likeCount: 52000000,
    thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    summary:
      "The most-viewed video on YouTube for years with over 8 billion views.\nLatin pop masterpiece featuring Luis Fonsi and Daddy Yankee.\nCatchy reggaeton beat that dominated global charts in 2017.",
    watchScore: 8,
    watchScoreReason:
      "Record-breaking hit with infectious melody. Great for music lovers.",
    keywords: ["Latin", "Reggaeton", "Spanish", "Music", "Dance", "Puerto Rico"],
    highlights: [
      {
        timestamp: 0,
        title: "Intro",
        description: "Opening guitar riff",
      },
      {
        timestamp: 45,
        title: "Despacito",
        description: "Main chorus begins",
      },
      {
        timestamp: 120,
        title: "Daddy Yankee",
        description: "Daddy Yankee's verse",
      },
    ],
    language: "es",
    transcriptSource: "youtube",
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-5",
    videoId: "fJ9rUzIMcZQ",
    url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
    channelName: "Queen Official",
    channelId: "UCiMhD4jzUqG-IgPzUmmytRQ",
    publishedAt: "2008-08-01T00:00:00Z",
    duration: 367,
    viewCount: 1800000000,
    likeCount: 19000000,
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
    summary:
      "Queen's legendary 1975 masterpiece, remastered in HD.\nA six-minute operatic rock epic that defied all conventions.\nWidely considered one of the greatest songs ever recorded.",
    watchScore: 10,
    watchScoreReason:
      "Musical masterpiece. Essential viewing for any music enthusiast.",
    keywords: ["Rock", "Queen", "Classic", "Opera", "Freddie Mercury", "1975"],
    highlights: [
      {
        timestamp: 0,
        title: "Is this real life?",
        description: "Iconic piano intro and ballad section",
      },
      {
        timestamp: 49,
        title: "Mama, just killed a man",
        description: "The emotional ballad continues",
      },
      {
        timestamp: 180,
        title: "Opera Section",
        description: "Galileo! Galileo!",
      },
      {
        timestamp: 270,
        title: "Hard Rock",
        description: "So you think you can stone me",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    analyzedAt: new Date().toISOString(),
  },
];

// Get a random sample video
export function getRandomSampleVideo(): VideoAnalysis {
  const randomIndex = Math.floor(Math.random() * sampleVideos.length);
  return sampleVideos[randomIndex];
}
