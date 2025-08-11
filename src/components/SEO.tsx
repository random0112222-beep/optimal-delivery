import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any> | null;
}

const SEO = ({ title, description, canonicalUrl, structuredData }: SEOProps) => {
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", name);
        document.head.appendChild(m);
      }
      return m as HTMLMetaElement;
    };

    if (description) {
      const metaDesc = ensureMeta("description");
      metaDesc.setAttribute("content", description);
    }

    const ensureLink = (rel: string) => {
      let l = document.querySelector(`link[rel="${rel}"]`);
      if (!l) {
        l = document.createElement("link");
        l.setAttribute("rel", rel);
        document.head.appendChild(l);
      }
      return l as HTMLLinkElement;
    };

    const canonical = ensureLink("canonical");
    canonical.setAttribute("href", canonicalUrl || window.location.href);

    const existingLd = document.getElementById("ld-json");
    if (existingLd) existingLd.remove();
    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "ld-json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalUrl, structuredData]);

  return null;
};

export default SEO;
