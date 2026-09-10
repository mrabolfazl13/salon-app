# -*- coding: utf-8 -*-
"""Patch ManagerDashboard.tsx: add image upload + amenities to venue create dialog"""
import sys

P = r'd:/Codes/Apps/Salon/futsal-booking-system/frontend/src/pages/dashboard/ManagerDashboard.tsx'
raw = open(P, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw

def R(s):
    return s.replace('\n', '\r\n') if crlf else s

pairs = []

# 1) import uploadService
pairs.append((
"""import { bookingService } from '@/services/booking'""",
"""import { bookingService } from '@/services/booking'
import { uploadService } from '@/services/upload'"""
))

# 2) state: add images, newAmenity, uploadingImages; Qom default coords
pairs.append((
"""  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: 35.6892,
    longitude: 51.3890,
    description: '',
    amenities: [] as string[],
  })""",
"""  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: 34.6482,
    longitude: 50.8799,
    description: '',
    amenities: [] as string[],
    images: [] as string[],
  })
  const [newAmenity, setNewAmenity] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)"""
))

# 3) handleCreateVenue + new handlers
pairs.append((
"""  const handleCreateVenue = async () => {
    try {
      await venueService.create({
        ...newVenue,
        amenities: newVenue.amenities.filter(a => a.trim()),
        images: [],
      })
      toast.success('سالن با موفقیت ایجاد شد')
      setOpenCreateVenue(false)
      setNewVenue({ name: '', address: '', phone: '', latitude: 35.6892, longitude: 51.3890, description: '', amenities: [] })
      fetchVenues()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد سالن')
    }
  }""",
"""  const handleCreateVenue = async () => {
    try {
      await venueService.create({
        ...newVenue,
        amenities: newVenue.amenities.filter(a => a.trim()),
        images: newVenue.images,
      })
      toast.success('سالن با موفقیت ایجاد شد')
      setOpenCreateVenue(false)
      setNewVenue({ name: '', address: '', phone: '', latitude: 34.6482, longitude: 50.8799, description: '', amenities: [], images: [] })
      setNewAmenity('')
      fetchVenues()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد سالن')
    }
  }

  const addAmenity = () => {
    const a = newAmenity.trim()
    if (a && !newVenue.amenities.includes(a)) {
      setNewVenue({ ...newVenue, amenities: [...newVenue.amenities, a] })
    }
    setNewAmenity('')
  }

  const removeAmenity = (a: string) => {
    setNewVenue(prev => ({ ...prev, amenities: prev.amenities.filter(x => x !== a) }))
  }

  const handleImageUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).slice(0, 10)
    setUploadingImages(true)
    try {
      const urls = await uploadService.uploadImages(files)
      setNewVenue(prev => ({ ...prev, images: [...prev.images, ...urls] }))
      toast.success(`${urls.length} عکس با موفقیت آپلود شد`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در آپلود عکس‌ها')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (url: string) => {
    setNewVenue(prev => ({ ...prev, images: prev.images.filter(x => x !== url) }))
  }"""
))

# 4) dialog: amenities + image upload sections
pairs.append((
"""          <TextField
            fullWidth
            label="توضیحات"
            value={newVenue.description}
            onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
            multiline
            rows={3}
            variant="outlined"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
        </DialogContent>""",
"""          <TextField
            fullWidth
            label="توضیحات"
            value={newVenue.description}
            onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
            multiline
            rows={3}
            variant="outlined"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
          {/* امکانات سالن */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>امکانات سالن</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                placeholder="مثلاً: پارکینگ، دوش، رختکن..."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
              <Button
                onClick={addAmenity}
                variant="outlined"
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(37,99,235,0.3)', color: 'primary.main' }}
              >
                افزودن
              </Button>
            </Box>
            {newVenue.amenities.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {newVenue.amenities.map(a => (
                  <Chip
                    key={a}
                    label={a}
                    size="small"
                    onDelete={() => removeAmenity(a)}
                    sx={{ borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.08)', color: 'primary.main', fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}
          </Box>
          {/* عکس‌های سالن */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              عکس‌های سالن <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(حداکثر ۱۰ عکس، هرکدام تا ۵MB)</span>
            </Typography>
            <Box
              onClick={() => document.getElementById('venue-image-upload')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files) }}
              sx={{
                border: '2px dashed rgba(37,99,235,0.25)',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'rgba(37,99,235,0.03)',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'rgba(37,99,235,0.5)', bgcolor: 'rgba(37,99,235,0.06)' },
              }}
            >
              {uploadingImages ? (
                <CircularProgress size={32} />
              ) : (
                <Box>
                  <Icon icon="mdi:camera-plus-outline" className="h-8 w-8" style={{ color: '#2563eb' }} />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    برای انتخاب عکس کلیک کنید یا بکشید و رها کنید
                  </Typography>
                </Box>
              )}
              <input
                id="venue-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { handleImageUpload(e.target.files); e.target.value = '' }}
              />
            </Box>
            {newVenue.images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {newVenue.images.map((img, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 80, height: 80, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <img src={img} alt={`عکس ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box
                      onClick={() => removeImage(img)}
                      sx={{ position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" style={{ color: 'white' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>"""
))

for i, (old, new) in enumerate(pairs):
    old2, new2 = R(old), R(new)
    if old2 not in raw:
        print(f'MISS at patch {i}: {old[:70]!r}')
        sys.exit(1)
    raw = raw.replace(old2, new2, 1)

open(P, 'wb').write(raw.encode('utf-8'))
print(f'OK: {len(pairs)} patches applied (CRLF={crlf})')
