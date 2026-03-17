import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const cache: Record<string, string> = {};
const FALLBACK = 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400';

/**
 * Bulk-fetch first images for multiple product IDs.
 * Priority: main_image_url (from products table) → product_images table → fallback
 */
export function useProductImages(
  productIds: string[],
  mainImageUrls?: Record<string, string | null>
): Record<string, string> {

  const [images, setImages] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    productIds.forEach(id => {
      // Use cache, then main_image_url, then fallback as initial value
      initial[id] = cache[id] || mainImageUrls?.[id] || FALLBACK;
    });
    return initial;
  });

  useEffect(() => {
    if (productIds.length === 0) return;

    // Separate products: those with main_image_url vs those without
    const withImage: Record<string, string> = {};
    const needsFetch: string[] = [];

    productIds.forEach(id => {
      if (cache[id]) {
        withImage[id] = cache[id];
      } else if (mainImageUrls?.[id]) {
        withImage[id] = mainImageUrls[id]!;
        cache[id] = mainImageUrls[id]!;
      } else {
        needsFetch.push(id);
      }
    });

    // Update state with what we already have
    if (Object.keys(withImage).length > 0) {
      setImages(prev => ({ ...prev, ...withImage }));
    }

    // Only fetch from product_images for products missing main_image_url
    if (needsFetch.length === 0) return;

    supabase
      .from('product_images')
      .select('product_id, image_url')
      .in('product_id', needsFetch)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        const seen = new Set<string>();
        const result: Record<string, string> = {};

        data?.forEach(row => {
          if (!seen.has(row.product_id)) {
            seen.add(row.product_id);
            result[row.product_id] = row.image_url;
          }
        });

        // Fallback for any still missing
        needsFetch.forEach(id => {
          if (!result[id]) result[id] = FALLBACK;
          cache[id] = result[id];
        });

        setImages(prev => ({ ...prev, ...result }));
      });
  }, [productIds.join(',')]);

  return images;
}
