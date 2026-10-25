import ironForgeImage from '../assets/centres/iron-forge.jpg';
import zenFlowImage from '../assets/centres/zen-flow.jpg';
import powerhouseImage from '../assets/centres/powerhouse.jpg';

export function getCentreImage(centre) {
  if (centre.image_url) return centre.image_url;

  const name = centre.name.toLowerCase();
  if (name.includes('zen') || name.includes('yoga') || name.includes('pilates')) return zenFlowImage;
  if (name.includes('power') || name.includes('boxing') || name.includes('hiit')) return powerhouseImage;
  return ironForgeImage;
}
