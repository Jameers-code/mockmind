import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://mockmind.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/setup"],
        disallow: ["/dashboard", "/interview", "/results", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
