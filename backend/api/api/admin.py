from django.contrib import admin
from .models import Category, MenuItem, Order, OrderItem

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

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_ref', 'customer_name', 'phone', 'total_amount', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['order_ref', 'customer_name', 'phone', 'address']
    inlines = [OrderItemInline]
