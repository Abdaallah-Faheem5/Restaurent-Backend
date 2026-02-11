const Category = require('../model/category.model');
const MenuItem = require('../model/menuItem.model');
const { v2: cloudinary } = require('cloudinary');

const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const isCloudinaryUrl = (value = '') =>
    typeof value === 'string' && /^https?:\/\/res\.cloudinary\.com\//i.test(value);

const isDataImageUrl = (value = '') =>
    typeof value === 'string' && /^data:image\//i.test(value);

const isHttpUrl = (value = '') =>
    typeof value === 'string' && /^https?:\/\//i.test(value);

// Configure Cloudinary
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim().toLowerCase(),
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImageToCloudinary = async (imageUrl, publicId) => {
    if (!hasCloudinaryConfig) {
        throw new Error('Cloudinary configuration is missing');
    }

    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            public_id: publicId,
            folder: 'restaurant/menu-items',
            resource_type: 'auto',
            overwrite: true
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};


class MenuController {

    async getAllCategories(req, res) {
        try {
            const activeCategories = await Category.find().lean();

            res.json({
                success: true,
                count: activeCategories.length,
                data: activeCategories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في جلب الفئات',
                error: error.message
            });
        }
    }
    async getAllMenuItems(req, res) {
        try {
            const { category,
                available,
                search } = req.query;

            let filter = {};

            // Filter by category
            if (category) {
                filter.categoryId = category;
            }


            // Search by name or description
            if (search) {
                const searchLower = search.toLowerCase();
                filter.$or = [
                    { name: { $regex: searchLower, $options: 'i' } },
                    { nameEn: { $regex: searchLower, $options: 'i' } },
                    { description: { $regex: searchLower, $options: 'i' } }
                ];
            }

            const filteredItems = await MenuItem.find(filter).lean();

            res.json({
                success: true,
                count: filteredItems.length,
                data: filteredItems
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في جلب العناصر',
                error: error.message
            });
        }
    }
    async getMenuItemById(req, res) {
        try {
            const item = await MenuItem.findById(req.params.id).lean();

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'العنصر غير موجود'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ',
                error: error.message
            });
        }
    }
    async getItemsByCategory(req, res) {
        try {
            const categoryId = req.params.categoryId;
            const category = await Category.findById(categoryId).lean();

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'الفئة غير موجودة'
                });
            }

            const items = await MenuItem.find({ categoryId }).lean();

            res.json({
                success: true,
                category: category,
                count: items.length,
                data: items
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ',
                error: error.message
            });
        }
    }
    async createCategory(req, res) {
        try {
            const { name, nameEn, description, displayOrder } = req.body;

            if (!name || !nameEn) {
                return res.status(400).json({
                    success: false,
                    message: 'الاسم بالعربي والإنجليزي مطلوبان'
                });
            }


            const existingCategory = await Category.findOne({ name, nameEn });
            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: 'هذه الفئة موجودة بالفعل'
                });
            }

            const newCategory = new Category({
                name,
                nameEn,
                description: description || '',
                displayOrder: displayOrder || 0

            });

            await newCategory.save();

            res.status(201).json({
                success: true,
                message: 'تم إضافة الفئة بنجاح',
                data: newCategory
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في إضافة الفئة',
                error: error.message
            });
        }
    }
    async updateCategory(req, res) {
        try {
            const categoryId = req.params.id;
            const category = await Category.findById(categoryId);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'الفئة غير موجودة'
                });
            }

            const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body, { new: true });

            res.json({
                success: true,
                message: 'تم تحديث الفئة بنجاح',
                data: updatedCategory
            });

            res.json({
                success: true,
                message: 'تم تحديث الفئة بنجاح',
                data: categories[categoryIndex]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في التحديث',
                error: error.message
            });
        }
    }
    async deleteCategory(req, res) {
        try {
            const categoryId = req.params.id;
            const category = await Category.findById(categoryId);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'الفئة غير موجودة'
                });
            }

            // Check if category has items
            const hasItems = await MenuItem.exists({ categoryId: categoryId });
            if (hasItems) {
                return res.status(400).json({
                    success: false,
                    message: 'لا يمكن حذف فئة تحتوي على عناصر'
                });
            }

            await Category.findByIdAndDelete(categoryId);

            res.json({
                success: true,
                message: 'تم حذف الفئة بنجاح'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في الحذف',
                error: error.message
            });
        }
    }
    async createMenuItem(req, res) {
        try {
            const { categoryId, name, nameEn, description, price, image, imageUrl: providedImageUrl } = req.body;

            if (!categoryId || !name || !nameEn || !price) {
                return res.status(400).json({
                    success: false,
                    message: 'الفئة والاسم والسعر مطلوبة'
                });
            }

            const existingItem = await MenuItem.findOne({ name, nameEn });
            if (existingItem) {
                return res.status(409).json({
                    success: false,
                    message: 'هذا العنصر موجود بالفعل'
                });
            }

            const category = await Category.findOne({ _id: categoryId }).lean();
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'الفئة غير موجودة'
                });
            }

            let imageUrl = '';

            const providedImage = providedImageUrl || image;

            // Accept already-usable image values, otherwise upload to Cloudinary
            if (providedImage) {
                try {
                    if (isCloudinaryUrl(providedImage) || isDataImageUrl(providedImage) || isHttpUrl(providedImage)) {
                        imageUrl = providedImage;
                    } else {
                        const sanitizedName = name.replace(/\s+/g, '_').toLowerCase();
                        imageUrl = await uploadImageToCloudinary(
                            providedImage,
                            `menu-item-${Date.now()}-${sanitizedName}`
                        );
                    }
                } catch (uploadError) {
                    console.error('Image upload failed, using default:', uploadError);
                }
            }

            const newItem = new MenuItem({
                categoryId,
                name,
                nameEn,
                description: description || '',
                price: parseFloat(price),
                imageUrl
            });

            await newItem.save();

            res.status(201).json({
                success: true,
                message: 'تم إضافة العنصر بنجاح',
                data: newItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في الإضافة',
                error: error.message
            });
        }
    }
    async updateMenuItem(req, res) {
        try {
            const itemId = req.params.id;
            const { image, imageUrl, ...updateData } = req.body;

            const item = await MenuItem.findById(itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'العنصر غير موجود'
                });
            }

            const incomingImage = imageUrl || image;

            // Accept already-usable image values, otherwise upload to Cloudinary
            if (incomingImage && incomingImage !== item.imageUrl) {
                try {
                    if (isCloudinaryUrl(incomingImage) || isDataImageUrl(incomingImage) || isHttpUrl(incomingImage)) {
                        updateData.imageUrl = incomingImage;
                    } else {
                        const sanitizedName = updateData.name || item.name;
                        const newImageUrl = await uploadImageToCloudinary(
                            incomingImage,
                            `menu-item-${Date.now()}-${sanitizedName.replace(/\s+/g, '_').toLowerCase()}`
                        );
                        updateData.imageUrl = newImageUrl;
                    }
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                }
            }

            const updatedItem = await MenuItem.findByIdAndUpdate(itemId, updateData, { new: true });

            return res.json({
                success: true,
                message: 'تم تحديث العنصر بنجاح',
                data: updatedItem
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في التحديث',
                error: error.message
            });
        }
    }
    async deleteMenuItem(req, res) {
    try {
      const itemId = req.params.id;
      const item = await MenuItem.findById(itemId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'العنصر غير موجود'
        });
      }

      // Delete image from Cloudinary if it exists
      if (item.imageUrl) {
        try {
          // Extract public_id from Cloudinary URL
          // Format: https://res.cloudinary.com/.../{v{version}}/{public_id}
          const urlParts = item.imageUrl.split('/');
          const publicId = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
          if (publicId) {
            await deleteImageFromCloudinary(publicId);
          }
        } catch (deleteError) {
          console.error('Failed to delete image from Cloudinary:', deleteError);
          // Continue with deletion even if image deletion fails
        }
      }

      await MenuItem.findByIdAndDelete(itemId);

      res.json({
        success: true,
        message: 'تم حذف العنصر بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في الحذف',
        error: error.message
      });
    }
  }

  // Upload image to temporary storage and return it
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم تحديد صورة'
        });
      }

      if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'Only image files are allowed'
        });
      }

      // Convert file buffer to base64
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Default to data URL so upload still works even if Cloudinary is misconfigured.
      let imageUrl = base64Image;
      if (hasCloudinaryConfig) {
        try {
          const sanitizedName = req.file.originalname.replace(/\s+/g, '_').toLowerCase();
          imageUrl = await uploadImageToCloudinary(
            base64Image,
            `temp-${Date.now()}-${sanitizedName}`
          );
        } catch (cloudinaryError) {
          console.error('Cloudinary upload failed, using data URL fallback:', cloudinaryError);
        }
      }

      res.json({
        success: true,
        message: 'تم رفع الصورة بنجاح',
        imageUrl
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في رفع الصورة',
        error: error.message
      });
    }
  }
}

module.exports = new MenuController();
