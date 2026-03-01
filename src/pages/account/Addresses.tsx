import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, Navigation, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Address } from '../../types';
import { toast } from '../../utils/toast';

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      setFetchingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Using OpenStreetMap Nominatim API for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
            );

            const data = await response.json();

            if (data && data.address) {
              const addr = data.address;

              // Better address mapping for Indian addresses
              const addressLine1 = [
                addr.house_number,
                addr.road || addr.street,
                addr.neighbourhood || addr.suburb
              ].filter(Boolean).join(', ');

              const addressLine2 = [
                addr.locality,
                addr.sublocality
              ].filter(Boolean).join(', ');

              setFormData(prev => ({
                ...prev,
                address_line1: addressLine1 || addr.display_name?.split(',')[0] || '',
                address_line2: addressLine2 || '',
                city: addr.city || addr.town || addr.village || addr.municipality || '',
                state: addr.state || addr.state_district || '',
                postal_code: addr.postcode || '',
                country: addr.country || 'India'
              }));

              toast.success('Location detected successfully! Please verify the details.');
            } else {
              toast.warning('Could not fetch address details. Please enter manually.');
            }
          } catch (error) {
            console.error('Error fetching location:', error);
            toast.error('Failed to fetch location details. Please enter manually.');
          } finally {
            setFetchingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMsg = 'Unable to get your location. ';
          if (error.code === 1) {
            errorMsg += 'Please allow location access in your browser settings.';
          } else if (error.code === 2) {
            errorMsg += 'Location information is unavailable.';
          } else if (error.code === 3) {
            errorMsg += 'Location request timed out.';
          }
          toast.error(errorMsg);
          setFetchingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
      }

      await fetchAddresses();
      resetForm();
      toast.success(editingId ? 'Address updated!' : 'Address added!');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
      toast.success('Address deleted!');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default address');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      is_default: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        to="/account"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-4 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-light">My Addresses</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            {!editingId && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={fetchingLocation}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {fetchingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Use Current Location
                  </>
                )}
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
              <input
                type="text"
                required
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address Line 2</label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-400 dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-rose-400 focus:ring-rose-400"
              />
              <label htmlFor="is_default" className="text-sm">
                Set as default address
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                {editingId ? 'Update' : 'Save'} Address
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No addresses saved yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg relative"
            >
              {address.is_default && (
                <span className="absolute top-4 right-4 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                  Default
                </span>
              )}
              <h3 className="font-medium mb-2">{address.full_name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{address.phone}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {address.address_line1}
              </p>
              {address.address_line2 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {address.address_line2}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {address.city}, {address.state} {address.postal_code}
              </p>
              <div className="flex gap-2 mt-4">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm text-rose-400 hover:text-rose-500"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="text-sm text-blue-400 hover:text-blue-500 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="text-sm text-red-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
