from django.contrib import admin
from .models import Category, MenuItem, DeliveryArea, Order, OrderItem, Customer, RestaurantSettings

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['item_name', 'unit_price', 'quantity', 'subtotal']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'price', 'is_available', 'is_daily_special', 'popular']
    list_filter = ['category', 'is_available', 'is_daily_special', 'popular']
    search_fields = ['name', 'code', 'description']
    list_editable = ['price', 'is_available', 'is_daily_special', 'popular']

@admin.register(DeliveryArea)
class DeliveryAreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'zone', 'zone_label', 'fee', 'is_active']
    list_filter = ['zone', 'is_active']
    search_fields = ['name', 'slug']
    list_editable = ['fee', 'is_active']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_ref', 'customer_name', 'phone', 'order_type', 'delivery_area', 'delivery_fee', 'subtotal', 'total_amount', 'has_allergy', 'payment_method', 'payment_status', 'status', 'created_at']
    list_filter = ['order_type', 'has_allergy', 'status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['order_ref', 'customer_name', 'phone', 'address', 'delivery_area']
    inlines = [OrderItemInline]

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'address', 'created_at']
    search_fields = ['name', 'phone', 'address']


@admin.register(RestaurantSettings)
class RestaurantSettingsAdmin(admin.ModelAdmin):
    list_display = ['manual_closed', 'closed_message', 'updated_at']
