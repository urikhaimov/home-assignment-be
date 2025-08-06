import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostGroup } from '../entities/post-group.entity';
import { Post } from '../entities/post.entity';
import {
  PostStatus,
  SocialPillar,
  SocialPlatform,
} from '../graphql/graphql.types';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(PostGroup)
    private readonly postGroupRepository: Repository<PostGroup>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  private generatePostGroups() {
    const authorityContent = [
      {
        content:
          "Ready to celebrate a decade of strength and resilience? Join us for *A Decade of Strength Gala*—an evening filled with hope, unity, and inspiration. Who's excited to lift each other up and make a real difference? 💪",
        scheduledDate: new Date('2025-06-28T18:00:00Z'),
      },
      {
        content:
          "Leading through uncertainty requires courage, vision, and unwavering commitment to your values. Here's what we've learned about authentic leadership in challenging times.",
        scheduledDate: new Date('2025-07-15T14:00:00Z'),
      },
      {
        content:
          "Thought leadership isn't about having all the answers—it's about asking the right questions and fostering meaningful dialogue in your industry.",
        scheduledDate: new Date('2025-08-20T10:30:00Z'),
      },
      {
        content:
          'Building trust takes years, but it can be lost in moments. Here are the 5 principles we use to maintain stakeholder confidence in everything we do.',
        scheduledDate: new Date('2025-09-10T16:45:00Z'),
      },
      {
        content:
          "Excellence isn't a destination—it's a mindset. Today marks our 15th consecutive award for industry innovation, and we're just getting started.",
        scheduledDate: new Date('2025-05-25T11:20:00Z'),
      },
    ];

    const communityContent = [
      {
        content:
          "Building communities starts with small acts of kindness. Today, let's focus on how we can support each other in meaningful ways.",
        scheduledDate: new Date('2025-07-02T12:00:00Z'),
      },
      {
        content:
          "Community isn't just about being together—it's about growing together. Thank you to everyone who joined our volunteer initiative this weekend! 🙌",
        scheduledDate: new Date('2025-06-15T09:30:00Z'),
      },
      {
        content:
          'When we lift each other up, we all rise higher. Celebrating the incredible achievements of our community members this month!',
        scheduledDate: new Date('2025-08-05T15:15:00Z'),
      },
      {
        content:
          'Connection is what gives our lives meaning. Join us for our monthly community coffee chat this Friday—new faces always welcome!',
        scheduledDate: new Date('2025-07-22T08:45:00Z'),
      },
      {
        content:
          'A strong community is built on shared values, mutual respect, and the belief that together we can achieve more than we ever could alone.',
        scheduledDate: new Date('2025-09-30T13:00:00Z'),
      },
      {
        content:
          "Diversity isn't just our strength—it's our superpower. Celebrating the beautiful tapestry of voices, perspectives, and experiences in our community.",
        scheduledDate: new Date('2025-06-01T17:30:00Z'),
      },
    ];

    const educationContent = [
      {
        content:
          "Innovation happens when we combine experience with fresh perspectives. Here's what we've learned about fostering creativity in teams.",
        scheduledDate: new Date('2025-08-15T14:30:00Z'),
      },
      {
        content:
          'The future belongs to lifelong learners. Here are 7 habits that successful professionals use to stay ahead in rapidly changing industries.',
        scheduledDate: new Date('2025-07-08T10:00:00Z'),
      },
      {
        content:
          "Data tells a story, but it's up to us to listen. Breaking down complex analytics into actionable insights for better decision-making.",
        scheduledDate: new Date('2025-06-20T14:45:00Z'),
      },
      {
        content:
          'Mentorship is a two-way street. What we learn from teaching often exceeds what we gain from learning. Who has been your most impactful mentor?',
        scheduledDate: new Date('2025-09-12T11:30:00Z'),
      },
      {
        content:
          'Critical thinking in the digital age: How to evaluate information, avoid cognitive biases, and make decisions based on evidence rather than emotion.',
        scheduledDate: new Date('2025-05-18T16:00:00Z'),
      },
      {
        content:
          'The art of asking better questions: Why curiosity is the most undervalued skill in business and how to cultivate it in your team.',
        scheduledDate: new Date('2025-08-28T09:15:00Z'),
      },
    ];

    const entertainmentContent = [
      {
        content:
          "Friday vibes are here! 🎉 What's your go-to way to unwind after a productive week? Share your favorite weekend activities below!",
        scheduledDate: new Date('2025-06-13T17:00:00Z'),
      },
      {
        content:
          'Plot twist: The best meetings are the ones that feel like conversations with friends. How do you keep your team engaged and energized?',
        scheduledDate: new Date('2025-07-25T12:30:00Z'),
      },
      {
        content:
          "Behind the scenes: Our team's latest creative brainstorming session involved post-it notes, coffee, and a lot of laughter. The best ideas come from the most unexpected places! ☕️",
        scheduledDate: new Date('2025-08-02T15:45:00Z'),
      },
      {
        content:
          "Monday motivation with a twist: What if we celebrated small wins the same way we celebrate big ones? Today, we're cheering for perfectly timed coffee runs! ☕️🎊",
        scheduledDate: new Date('2025-09-16T08:00:00Z'),
      },
      {
        content:
          "Team trivia night was a huge success! Nothing builds camaraderie quite like friendly competition and shared laughter. What's your team's favorite bonding activity?",
        scheduledDate: new Date('2025-06-08T19:20:00Z'),
      },
    ];

    const inspirationContent = [
      {
        content:
          'Every challenge is an opportunity to grow stronger. Remember that setbacks are setups for comebacks.',
        scheduledDate: new Date('2025-01-15T09:00:00Z'),
      },
      {
        content:
          'Your dreams are valid, your goals are achievable, and your potential is unlimited. The only question is: what will you do with today?',
        scheduledDate: new Date('2025-07-03T07:30:00Z'),
      },
      {
        content:
          "Progress isn't always visible, but it's always happening. Trust the process, celebrate small victories, and keep moving forward. 🌟",
        scheduledDate: new Date('2025-08-17T06:45:00Z'),
      },
      {
        content:
          "The most successful people aren't those who never fail—they're those who never stop learning from their failures and trying again.",
        scheduledDate: new Date('2025-09-05T08:15:00Z'),
      },
      {
        content:
          'Your comfort zone is a beautiful place, but nothing ever grows there. Today is the perfect day to take that first step toward something amazing.',
        scheduledDate: new Date('2025-06-10T10:00:00Z'),
      },
      {
        content:
          "Believe in yourself even when others don't. Your self-belief is the foundation upon which all your achievements will be built.",
        scheduledDate: new Date('2025-07-28T16:30:00Z'),
      },
    ];

    const allContent = [
      ...authorityContent.map((item) => ({
        ...item,
        pillar: SocialPillar.AUTHORITY,
      })),
      ...communityContent.map((item) => ({
        ...item,
        pillar: SocialPillar.COMMUNITY,
      })),
      ...educationContent.map((item) => ({
        ...item,
        pillar: SocialPillar.EDUCATION,
      })),
      ...entertainmentContent.map((item) => ({
        ...item,
        pillar: SocialPillar.ENTERTAINMENT,
      })),
      ...inspirationContent.map((item) => ({
        ...item,
        pillar: SocialPillar.INSPIRATION,
      })),
    ];

    const postGroups: PostGroup[] = [];
    const statuses = [
      PostStatus.PENDING_REVIEW,
      PostStatus.SCHEDULED,
      PostStatus.PUBLISHED,
    ];

    allContent.forEach((contentItem, index) => {
      const statusIndex = index % 3;
      const status = statuses[statusIndex];
      const imageId = (index % 50) + 200; // Use images 200-249 from Picsum

      // Generate different image dimensions for variety
      const dimensions = [
        '800/600',
        '600/800',
        '1000/600',
        '800/800',
        '1200/800',
      ];
      const dimension = dimensions[index % dimensions.length];

      const postGroup: Partial<PostGroup> = {
        content: contentItem.content,
        mediaUrls: [
          `https://picsum.photos/id/${imageId}/${dimension}`,
          // Some posts have multiple images
          ...(index % 4 === 0
            ? [`https://picsum.photos/id/${imageId + 50}/${dimension}`]
            : []),
        ],
        pillar: contentItem.pillar,
        status: status,
        scheduledDate: contentItem.scheduledDate,
        posts: this.generatePostsForPlatforms(
          contentItem.content,
          contentItem.pillar,
        ),
      };

      // Add published date and engagement stats for published posts
      if (status === PostStatus.PUBLISHED) {
        postGroup.publishedDate = contentItem.scheduledDate;
        postGroup.posts = postGroup.posts?.map((post: Post) => ({
          ...post,
          likes: Math.floor(Math.random() * 1000) + 50,
          comments: Math.floor(Math.random() * 200) + 10,
          shares: Math.floor(Math.random() * 100) + 5,
        }));
      }

      postGroups.push(postGroup as PostGroup);
    });

    return postGroups;
  }

  private generatePostsForPlatforms(content: string, pillar: SocialPillar) {
    const posts: Partial<Post>[] = [];

    // Always include Facebook
    posts.push({
      platform: SocialPlatform.FACEBOOK,
      caption: this.adaptContentForFacebook(content),
      likes: 0,
      comments: 0,
      shares: 0,
    });

    // Include Instagram for most content types
    if (pillar !== SocialPillar.EDUCATION || Math.random() > 0.3) {
      posts.push({
        platform: SocialPlatform.INSTAGRAM,
        caption: this.adaptContentForInstagram(content, pillar),
        likes: 0,
        comments: 0,
        shares: 0,
      });
    }

    // Include LinkedIn for authority, education, and some community content
    if (
      pillar === SocialPillar.AUTHORITY ||
      pillar === SocialPillar.EDUCATION ||
      (pillar === SocialPillar.COMMUNITY && Math.random() > 0.5)
    ) {
      posts.push({
        platform: SocialPlatform.LINKEDIN,
        caption: this.adaptContentForLinkedIn(content),
        likes: 0,
        comments: 0,
        shares: 0,
      });
    }

    return posts as Post[];
  }

  private adaptContentForFacebook(content: string): string {
    // Facebook allows longer content and casual tone
    return content;
  }

  private adaptContentForInstagram(
    content: string,
    pillar: SocialPillar,
  ): string {
    // Instagram needs hashtags and emojis
    const hashtags = this.getHashtagsForPillar(pillar);
    const emoji = this.getEmojiForPillar(pillar);

    return `${content} ${emoji}\n\n${hashtags}`;
  }

  private adaptContentForLinkedIn(content: string): string {
    // LinkedIn prefers professional tone and longer-form content
    if (content.length < 100) {
      return `${content}\n\nWhat are your thoughts on this approach? I'd love to hear your perspective in the comments.`;
    }
    return content;
  }

  private getHashtagsForPillar(pillar: SocialPillar): string {
    const hashtagMap = {
      [SocialPillar.AUTHORITY]:
        '#Leadership #ThoughtLeadership #Authority #BusinessLeadership #Innovation',
      [SocialPillar.COMMUNITY]:
        '#Community #Together #Support #Connection #Unity #Collaboration',
      [SocialPillar.EDUCATION]:
        '#Learning #Education #Growth #Knowledge #Skills #Development',
      [SocialPillar.ENTERTAINMENT]:
        '#Fun #TeamBuilding #Culture #Workplace #Engagement #Celebration',
      [SocialPillar.INSPIRATION]:
        '#Motivation #Inspiration #Success #GrowthMindset #Believe #Achievement',
    };
    return hashtagMap[pillar];
  }

  private getEmojiForPillar(pillar: SocialPillar): string {
    const emojiMap = {
      [SocialPillar.AUTHORITY]: '💼',
      [SocialPillar.COMMUNITY]: '🤝',
      [SocialPillar.EDUCATION]: '📚',
      [SocialPillar.ENTERTAINMENT]: '🎉',
      [SocialPillar.INSPIRATION]: '⭐',
    };
    return emojiMap[pillar];
  }

  async seed() {
    // Check if data already exists
    const existingCount = await this.postGroupRepository.count();
    if (existingCount > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with comprehensive test data...');

    const postGroups = this.generatePostGroups();

    for (const postGroupData of postGroups) {
      const { posts, ...groupData } = postGroupData;

      // Create post group
      const postGroup = this.postGroupRepository.create(groupData);
      const savedPostGroup = await this.postGroupRepository.save(postGroup);

      // Create associated posts
      const postsToCreate = posts.map((postData: Post) =>
        this.postRepository.create({
          platform: postData.platform,
          caption: postData.caption,
          likes: postData.likes || 0,
          comments: postData.comments || 0,
          shares: postData.shares || 0,
          postGroupId: savedPostGroup.id,
        }),
      );

      await this.postRepository.save(postsToCreate);
    }

    // Log seeding statistics
    const totalPostGroups = await this.postGroupRepository.count();
    const totalPosts = await this.postRepository.count();
    const pendingCount = await this.postGroupRepository.count({
      where: { status: PostStatus.PENDING_REVIEW },
    });
    const scheduledCount = await this.postGroupRepository.count({
      where: { status: PostStatus.SCHEDULED },
    });
    const publishedCount = await this.postGroupRepository.count({
      where: { status: PostStatus.PUBLISHED },
    });

    console.log('🎉 Database seeded successfully!');
    console.log(`📊 Seeding Statistics:`);
    console.log(`   └── Total Post Groups: ${totalPostGroups}`);
    console.log(`   └── Total Posts: ${totalPosts}`);
    console.log(`   └── Pending Review: ${pendingCount}`);
    console.log(`   └── Scheduled: ${scheduledCount}`);
    console.log(`   └── Published: ${publishedCount}`);
    console.log(
      `📸 All images sourced from Picsum Photos with various dimensions`,
    );
    console.log(`🏷️  Content distributed across all 5 social pillars`);
  }
}
