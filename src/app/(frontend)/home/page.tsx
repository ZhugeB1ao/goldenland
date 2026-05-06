import { HeroSection } from './components/HeroSection'
import { FeaturedArticlesSection } from './components/FearturedArticlesSection'
import { FeaturedProjectsSection } from './components/FeaturedProjectsSection'
import { PropertiesByLocationSection } from './components/PropertiesByLocationSection'
import { PropertyForYouSection } from './components/PropertyForYouSection'
import { RealEstateArticlesSection } from './components/RealEstateArticlesSection'

export default function Home() {
  return (
    <div className="pt-20">
      {/* Hero section for the homepage, showcasing a large banner image and a call-to-action button */}
      <HeroSection />

      {/* Featured articles section, highlighting the latest and most important articles in the real estate market */}
      <FeaturedArticlesSection />

      {/* Featured properties section, showcasing a selection of properties that are currently available for sale or rent */}
      <PropertyForYouSection />

      {/* Properties by location section, allowing users to browse properties based on their preferred locations */}
      <FeaturedProjectsSection />

      {/* Real estate news section, providing users with the latest updates and insights on the real estate market */}
      <PropertiesByLocationSection />

      {/* Real estate articles section, providing users with the latest updates and insights on the real estate market */}
      <RealEstateArticlesSection />
    </div>
  )
}
