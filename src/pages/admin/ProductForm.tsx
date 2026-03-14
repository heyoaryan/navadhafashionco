import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import RichTextEditor from '../../components/RichTextEditor';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface ColorOption {
  name: string;
  hex: string;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [colors, setColors] = useState<ColorOption[]>([{ name: '', hex: '#000000' }]);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'clearDraft' | null>(null);
  const [hasUserInput, setHasUserInput] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    cost_per_item: '',
    category: '',
    subcategory: '',
    gender: '',
    season: '',
    sku: '',
    barcode: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    sizes: '',
    is_active: true,
    tags: '',
    fabric_details: '',
    care_instructions: '',
    video_url: '',
  });
  const [boutiqueReadyMade, setBoutiqueReadyMade] = useState(false);
  const [boutiqueCustomization, setBoutiqueCustomization] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      // Also try to load saved draft for this product
      loadSavedFormData();
    } else {
      // Load saved form data from localStorage for new products
      loadSavedFormData();
    }
  }, [id]);

  // Auto-save form data to localStorage
  useEffect(() => {
    if (hasUserInput) {
      const timeoutId = setTimeout(() => {
        saveFormData();
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000);
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, imageUrls, colors, id, hasUserInput]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
      const hasDraft = localStorage.getItem(draftKey);
      if (hasDraft && hasUserInput) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, hasUserInput]);

  useEffect(() => {
    if (showConfirmModal) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [showConfirmModal]);

  const saveFormData = () => {
    try {
      const dataToSave = {
        formData,
        imageUrls,
        colors,
        timestamp: Date.now(),
      };
      const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
      localStorage.setItem(draftKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const loadSavedFormData = () => {
    try {
      const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const { formData: savedFormData, imageUrls: savedImageUrls, colors: savedColors, timestamp } = JSON.parse(saved);
        
        // Only load if saved within last 7 days
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < sevenDaysInMs) {
          setFormData(savedFormData);
          setImageUrls(savedImageUrls);
          setColors(savedColors);
        } else {
          // Clear old data
          localStorage.removeItem(draftKey);
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  };

  const clearSavedFormData = () => {
    try {
      const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };

  const fetchProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if there's a more recent draft
      const draftKey = `admin_product_form_draft_${id}`;
      const saved = localStorage.getItem(draftKey);
      let useDraft = false;

      if (saved) {
        const { timestamp } = JSON.parse(saved);
        const productUpdatedAt = new Date(data.updated_at).getTime();
        // Use draft if it's newer than the last product update
        if (timestamp > productUpdatedAt) {
          useDraft = true;
        }
      }

      // Only set form data from database if not using draft
      if (!useDraft) {
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          price: data.price.toString(),
          compare_at_price: data.compare_at_price?.toString() || '',
          cost_per_item: data.cost_per_item?.toString() || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          gender: data.gender || '',
          season: data.season || '',
          sku: data.sku || '',
          barcode: data.barcode || '',
          stock_quantity: data.stock_quantity.toString(),
          low_stock_threshold: data.low_stock_threshold?.toString() || '10',
          sizes: data.sizes?.join(', ') || '',
          is_active: data.is_active,
          tags: data.tags?.join(', ') || '',
          fabric_details: data.fabric_details || '',
          care_instructions: data.care_instructions || '',
          video_url: data.video_url || '',
        });

        // Set boutique flags from existing tags
        setBoutiqueReadyMade(data.tags?.includes('made') || false);
        setBoutiqueCustomization(data.tags?.includes('customization') || false);

        // Set images from product_images table
        const newImageUrls: string[] = [];
        if (data.product_images && data.product_images.length > 0) {
          const sortedImages = data.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
          sortedImages.forEach((img: any) => {
            newImageUrls.push(img.image_url);
          });
        }
        // Ensure at least one empty slot
        if (newImageUrls.length === 0) {
          newImageUrls.push('');
        }
        setImageUrls(newImageUrls);

        // Set colors
        if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setColors(data.colors.map((c: any) => ({
            name: c.name || '',
            hex: c.hex || '#000000',
          })));
        } else {
          setColors([{ name: '', hex: '#000000' }]);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addImageSlot = () => {
    setHasUserInput(true);
    setImageUrls([...imageUrls, '']);
  };

  const removeImageSlot = (index: number) => {
    if (imageUrls.length > 1) {
      setHasUserInput(true);
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    setHasUserInput(true);
    setUploadingVideo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/videos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        // If storage not set up, use local preview
        console.warn('Storage not configured, using local preview');
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            video_url: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
        showToast('Storage not configured. Using local preview.', 'warning');
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        video_url: data.publicUrl,
      }));
      showToast('Video uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading video:', error);
      showToast('Failed to upload video', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    setHasUserInput(true);
    setFormData(prev => ({
      ...prev,
      video_url: '',
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setHasUserInput(true);
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'name' && !id) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;

    setHasUserInput(true);
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // For now, we'll use a placeholder. You need to set up Supabase Storage first
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        // If storage not set up, use placeholder
        console.warn('Storage not configured, using placeholder');
        const reader = new FileReader();
        reader.onloadend = () => {
          const newUrls = [...imageUrls];
          newUrls[index] = reader.result as string;
          setImageUrls(newUrls);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const newUrls = [...imageUrls];
      newUrls[index] = data.publicUrl;
      setImageUrls(newUrls);
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image. Using local preview instead.', 'warning');
      
      // Fallback to local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newUrls = [...imageUrls];
        newUrls[index] = reader.result as string;
        setImageUrls(newUrls);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setHasUserInput(true);
    const newUrls = [...imageUrls];
    newUrls[index] = '';
    setImageUrls(newUrls);
  };

  const addColor = () => {
    setHasUserInput(true);
    setColors([...colors, { name: '', hex: '#000000' }]);
  };

  const removeColor = (index: number) => {
    if (colors.length > 1) {
      setHasUserInput(true);
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index: number, field: 'name' | 'hex', value: string) => {
    setHasUserInput(true);
    const newColors = [...colors];
    
    if (field === 'hex') {
      // Check for duplicate colors
      const colorName = getColorName(value);
      const isDuplicate = colors.some((c, i) => {
        if (i === index) return false; // Skip current color
        if (value === '#multicolor' && c.hex === '#multicolor') return true; // Multicolor duplicate
        return getColorName(c.hex) === colorName && colorName !== 'Custom'; // Same color name duplicate
      });

      if (isDuplicate) {
        if (value === '#multicolor') {
          showToast('Multicolor is already selected', 'error');
        } else {
          showToast(`${colorName} is already selected. Choose a different shade or color.`, 'error');
        }
        return;
      }

      newColors[index].hex = value;
      // Automatically update color name when hex changes
      newColors[index].name = colorName;
    } else {
      newColors[index][field] = value;
    }
    
    setColors(newColors);
  };

  // Function to get color name from hex
  const getColorName = (hex: string): string => {
    const colorMap: { [key: string]: string } = {
      '#000000': 'Black',
      '#ffffff': 'White',
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#ffa500': 'Orange',
      '#800080': 'Purple',
      '#ffc0cb': 'Pink',
      '#a52a2a': 'Brown',
      '#808080': 'Gray',
      '#c0c0c0': 'Silver',
      '#ffd700': 'Gold',
      '#4b0082': 'Indigo',
      '#ee82ee': 'Violet',
      '#f5f5dc': 'Beige',
      '#d2691e': 'Chocolate',
      '#ff6347': 'Tomato',
      '#40e0d0': 'Turquoise',
      '#da70d6': 'Orchid',
      '#87ceeb': 'Sky Blue',
      '#98fb98': 'Pale Green',
      '#dda0dd': 'Plum',
      '#f0e68c': 'Khaki',
      '#e6e6fa': 'Lavender',
      '#ffe4e1': 'Misty Rose',
      '#faebd7': 'Antique White',
      '#f5deb3': 'Wheat',
      '#fffacd': 'Lemon Chiffon',
      '#multicolor': 'Multicolor',
    };

    const lowerHex = hex.toLowerCase();
    
    // Check for exact match
    if (colorMap[lowerHex]) {
      return colorMap[lowerHex];
    }

    // Basic color detection based on RGB values
    const r = parseInt(lowerHex.slice(1, 3), 16);
    const g = parseInt(lowerHex.slice(3, 5), 16);
    const b = parseInt(lowerHex.slice(5, 7), 16);

    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 100 && b > 200) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && g < 100 && b > 200) return 'Magenta';
    if (r < 100 && g > 200 && b > 200) return 'Cyan';
    if (r > 200 && g > 150 && b < 100) return 'Orange';
    if (r > 150 && g < 100 && b > 150) return 'Purple';
    if (r > 200 && g > 150 && b > 150) return 'Pink';
    if (r < 50 && g < 50 && b < 50) return 'Black';
    if (r > 200 && g > 200 && b > 200) return 'White';
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'Gray';

    return 'Custom';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      { name: 'name', label: 'Product Name', ref: 'name' },
      { name: 'slug', label: 'Slug', ref: 'slug' },
      { name: 'price', label: 'Price', ref: 'price' },
      { name: 'gender', label: 'Gender', ref: 'gender' },
      { name: 'category', label: 'Main Category', ref: 'category' },
      { name: 'season', label: 'Season', ref: 'season' },
      { name: 'stock_quantity', label: 'Stock Quantity', ref: 'stock_quantity' },
    ];

    // Check for missing required fields
    for (const field of requiredFields) {
      if (!formData[field.name as keyof typeof formData] || formData[field.name as keyof typeof formData] === '') {
        showToast(`Please fill in the ${field.label} field`, 'error');
        
        // Scroll to the field and highlight it
        const element = document.querySelector(`[name="${field.name}"]`) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('border-red-500', 'ring-2', 'ring-red-500');
          element.focus();
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
          }, 3000);
        }
        return;
      }
    }

    // Check if at least one image is provided
    if (!imageUrls[0] || imageUrls[0] === '') {
      showToast('Please upload at least one product image', 'error');
      
      // Scroll to images section
      const imagesSection = document.querySelector('[data-section="images"]') as HTMLElement;
      if (imagesSection) {
        imagesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        imagesSection.classList.add('ring-2', 'ring-red-500', 'rounded-lg');
        
        setTimeout(() => {
          imagesSection.classList.remove('ring-2', 'ring-red-500');
        }, 3000);
      }
      return;
    }

    setLoading(true);

    try {
      const sizesArray = formData.sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Merge boutique tags - remove old ones first, then add based on checkboxes
      const boutiqueTags = ['made', 'customization'];
      const baseTags = tagsArray.filter(t => !boutiqueTags.includes(t));
      if (boutiqueReadyMade) baseTags.push('made');
      if (boutiqueCustomization) baseTags.push('customization');
      const finalTags = baseTags;

      const validColors = colors.filter(c => c.name.trim() !== '');

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        cost_per_item: formData.cost_per_item ? parseFloat(formData.cost_per_item) : null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        category_id: null, // Will be set based on category name
        gender: formData.gender || null,
        season: formData.season || null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        sizes: sizesArray,
        colors: validColors,
        main_image_url: imageUrls[0] || null,
        is_featured: false,
        is_active: formData.is_active,
        tags: finalTags,
        fabric_details: formData.fabric_details || null,
        care_instructions: formData.care_instructions || null,
        video_url: formData.video_url || null,
      };

      // Get category_id from categories table based on category name
      if (formData.category) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .ilike('slug', formData.category.toLowerCase().replace(/\s+/g, '-'))
          .maybeSingle();
        
        if (categoryData) {
          productData.category_id = categoryData.id;
        }
      }

      let productId = id;

      if (id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;

        // Delete existing product images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', id);
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Insert product images
      const validImages = imageUrls
        .map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
        }))
        .filter(img => img.image_url);

      if (validImages.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(validImages);

        if (imagesError) throw imagesError;
      }

      // Clear saved form data after successful submission
      clearSavedFormData();

      showToast(id ? 'Product updated successfully' : 'Product created successfully', 'success');
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast(error.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'cancel') {
      navigate('/admin/products');
    } else if (confirmAction === 'clearDraft') {
      clearSavedFormData();
      window.location.reload();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancelClick = () => {
    const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
    if (localStorage.getItem(draftKey)) {
      setConfirmAction('cancel');
      setShowConfirmModal(true);
    } else {
      navigate('/admin/products');
    }
  };

  const handleClearDraft = () => {
    setConfirmAction('clearDraft');
    setShowConfirmModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Loading State for Edit Mode */}
      {id && loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading product data...</p>
          </div>
        </div>
      )}

      {/* Show form only when not loading or in create mode */}
      {(!id || !loading) && (
        <>
          {/* Confirmation Modal */}
          {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 animate-fade-in-fast">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
              {confirmAction === 'cancel' ? 'Unsaved Changes' : 'Clear Draft'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmAction === 'cancel' 
                ? 'You have unsaved changes. Are you sure you want to leave?' 
                : 'Are you sure you want to clear the saved draft?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                {confirmAction === 'cancel' ? 'Leave' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {showSaveIndicator && hasUserInput && (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-md animate-fade-in-fast">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Draft Saved</span>
        </div>
      )}

      <button
        onClick={() => navigate('/admin/products')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wider mb-6 sm:mb-8 text-gray-900 dark:text-gray-100">
        {id ? 'Edit Product' : 'Add New Product'}
      </h1>

      {/* Draft notification */}
      {(() => {
        const draftKey = id ? `admin_product_form_draft_${id}` : 'admin_product_form_draft';
        return localStorage.getItem(draftKey) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Draft restored</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {id ? 'Your unsaved changes have been restored. Changes are auto-saved.' : 'Your previous form data has been restored. Changes are auto-saved.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium whitespace-nowrap ml-4"
            >
              Clear Draft
            </button>
          </div>
        );
      })()}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Slug *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Description</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => {
                setHasUserInput(true);
                setFormData(prev => ({ ...prev, description: value }));
              }}
              placeholder="Enter product description with formatting..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={(e) => {
                setHasUserInput(true);
                setFormData(prev => ({ 
                  ...prev, 
                  gender: e.target.value,
                  category: '', // Reset category when gender changes
                  subcategory: '' // Reset subcategory when gender changes
                }));
              }}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select Gender</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          {/* Boutique Listing */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Boutique Listing</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                <input
                  type="checkbox"
                  checked={boutiqueReadyMade}
                  onChange={(e) => {
                    setHasUserInput(true);
                    setBoutiqueReadyMade(e.target.checked);
                    // If only ready-made selected (bespoke not checked), clear category
                    if (e.target.checked && !boutiqueCustomization) {
                      setFormData(prev => ({ ...prev, category: '', subcategory: '', season: '' }));
                    }
                  }}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ready-Made Boutique</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Product will appear in Boutique → Ready-Made Collection</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                <input
                  type="checkbox"
                  checked={boutiqueCustomization}
                  onChange={(e) => { setHasUserInput(true); setBoutiqueCustomization(e.target.checked); }}
                  className="mt-0.5 w-4 h-4 text-rose-500 rounded focus:ring-rose-400"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Bespoke Customization</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Product will appear in Boutique → Customization (customers can request custom design, fit & fabric)</p>
                </div>
              </label>
            </div>
          </div>

          {formData.gender && !boutiqueReadyMade && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Main Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => {
                  setHasUserInput(true);
                  setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subcategory: '' // Reset subcategory when category changes
                  }));
                }}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Main Category</option>
                {formData.gender === 'men' && (
                  <>
                    <option value="casuals">Casuals</option>
                    <option value="workwear">Workwear</option>
                    <option value="ethnic">Ethnic</option>
                    <option value="gym-attire">Gym Attire</option>
                  </>
                )}
                {formData.gender === 'women' && (
                  <>
                    <option value="western">Western</option>
                    <option value="indo-western">Indo-Western</option>
                    <option value="ethnics">Ethnics</option>
                    <option value="casuals">Casuals</option>
                    <option value="workwear">Workwear</option>
                    <option value="gym-attire">Gym Attire</option>
                  </>
                )}
                {formData.gender === 'unisex' && (
                  <>
                    <option value="casuals">Casuals</option>
                    <option value="workwear">Workwear</option>
                    <option value="ethnic">Ethnic</option>
                    <option value="gym-attire">Gym Attire</option>
                    <option value="western">Western</option>
                    <option value="indo-western">Indo-Western</option>
                  </>
                )}
              </select>
            </div>
          )}

          {formData.category && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Season *</label>
              <select
                name="season"
                value={formData.season}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Season</option>
                <option value="all-season">All Season</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
              </select>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4" data-section="images">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100">Product Images</h2>
            <button
              type="button"
              onClick={addImageSlot}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#EE458F' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D63D7F'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EE458F'}
            >
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Image {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageSlot(index)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove image slot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {url ? (
                  <div className="relative">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            First image will be used as the main product image. You can add unlimited images.
          </p>
        </div>

        {/* Video */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Product Video (Optional)</h2>
          
          {formData.video_url ? (
            <div className="space-y-4">
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <video
                  src={formData.video_url}
                  controls
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  title="Remove video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Video uploaded successfully. Click the X button to remove and upload a different video.
              </p>
            </div>
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {uploadingVideo ? 'Uploading video...' : 'Click to upload video'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, WebM, or OGG (Max 100MB recommended)
                  </p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploadingVideo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (100MB limit)
                      if (file.size > 100 * 1024 * 1024) {
                        showToast('Video file is too large. Please upload a file smaller than 100MB.', 'error');
                        return;
                      }
                      handleVideoUpload(file);
                    }
                  }}
                />
              </label>
              {uploadingVideo && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-rose-500"></div>
                  <span>Uploading video, please wait...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Compare at Price</label>
              <input
                type="number"
                name="compare_at_price"
                value={formData.compare_at_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Cost per Item</label>
              <input
                type="number"
                name="cost_per_item"
                value={formData.cost_per_item}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Inventory</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Low Stock Threshold</label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Variants</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Sizes (comma separated)</label>
            <input
              type="text"
              name="sizes"
              value={formData.sizes}
              onChange={handleChange}
              placeholder="S, M, L, XL"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Colors</label>
              <button
                type="button"
                onClick={addColor}
                className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600"
              >
                <Plus className="w-4 h-4" />
                Add Color
              </button>
            </div>
            
            <div className="space-y-3">
              {colors.map((color, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Color name"
                      value={color.name}
                      onChange={(e) => updateColor(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {color.hex !== '#multicolor' && (
                        <>
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) => updateColor(index, 'hex', e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={color.hex}
                            onChange={(e) => updateColor(index, 'hex', e.target.value)}
                            placeholder="#000000"
                            className="w-24 px-2 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          />
                        </>
                      )}
                      {color.hex === '#multicolor' && (
                        <div className="w-36 h-10 rounded flex-shrink-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
                      )}
                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColor(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0"
                          title="Remove color"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {color.hex !== '#multicolor' && (
                    <label className="flex items-center gap-2 ml-1">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Check if multicolor already exists
                            const hasMulticolor = colors.some((c, i) => i !== index && c.hex === '#multicolor');
                            if (hasMulticolor) {
                              showToast('Multicolor is already selected', 'error');
                              return;
                            }
                            updateColor(index, 'hex', '#multicolor');
                            updateColor(index, 'name', 'Multicolor');
                          }
                        }}
                        className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">🌈 Multicolor</span>
                    </label>
                  )}
                  {color.hex === '#multicolor' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateColor(index, 'hex', '#000000');
                        updateColor(index, 'name', 'Black');
                      }}
                      className="text-sm text-blue-500 hover:text-blue-600 ml-1"
                    >
                      Change to regular color
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-medium mb-4 text-gray-900 dark:text-gray-100">Additional Details</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="saree, silk, traditional"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Fabric Details</label>
            <RichTextEditor
              value={formData.fabric_details}
              onChange={(value) => {
                setHasUserInput(true);
                setFormData(prev => ({ ...prev, fabric_details: value }));
              }}
              placeholder="Enter fabric details with formatting..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Care Instructions</label>
            <RichTextEditor
              value={formData.care_instructions}
              onChange={(value) => {
                setHasUserInput(true);
                setFormData(prev => ({ ...prev, care_instructions: value }));
              }}
              placeholder="Enter care instructions with formatting..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Active</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
          </button>
          
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
