-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'RECEPTION');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('PERCENTAGE', 'FIXED_PER_NIGHT', 'FIXED_PER_PERSON', 'FIXED_PER_BOOKING');

-- CreateEnum
CREATE TYPE "ResourceCategoryType" AS ENUM ('ACCOMMODATION', 'TIME_SLOT', 'QUANTITY_TIME');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SEASONAL');

-- CreateEnum
CREATE TYPE "AddonScope" AS ENUM ('GLOBAL', 'PER_ITEM');

-- CreateEnum
CREATE TYPE "AddonPricingType" AS ENUM ('PER_BOOKING', 'PER_NIGHT', 'PER_PERSON', 'PER_PERSON_NIGHT', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "AddonSelectType" AS ENUM ('CHECKBOX', 'QUANTITY', 'SELECT');

-- CreateEnum
CREATE TYPE "RatePlanModifier" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'SUPER_STRICT');

-- CreateEnum
CREATE TYPE "PriceRuleType" AS ENUM ('PER_ADULT', 'PER_CHILD', 'PER_INFANT', 'PER_HOUR', 'PER_DAY', 'PER_GROUP');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('CAMP', 'MAINTENANCE', 'OWNER_USE', 'EXTERNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('INTERNAL', 'PUBLIC', 'HOLIDAY', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "TimelineEntryType" AS ENUM ('BOOKING', 'BLOCK', 'OFFER');

-- CreateEnum
CREATE TYPE "TimelineEntryStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('BOOKING', 'OFFER', 'BLOCK');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'FINISHED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ResPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('PHONE', 'EMAIL', 'WEBSITE', 'WALK_IN', 'BOOKING_COM', 'SOCIAL', 'FRONT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpiryAction" AS ENUM ('CANCEL', 'NOTHING');

-- CreateEnum
CREATE TYPE "EmailLogType" AS ENUM ('BOOKING_CONFIRMATION', 'PAYMENT_REMINDER', 'STATUS_CONFIRMED', 'STATUS_CANCELLED', 'TEST');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('BOOKING_CONFIRMATION', 'PAYMENT_REMINDER', 'STATUS_CONFIRMED', 'STATUS_CANCELLED');

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('ADULT', 'CHILD', 'INFANT');

-- CreateEnum
CREATE TYPE "CleaningStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'GROUP');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClientSegment" AS ENUM ('STANDARD', 'VIP', 'PREMIUM', 'CORPORATE');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('MANUAL', 'WEBSITE', 'BOOKING_COM', 'AIRBNB', 'PHONE', 'EMAIL', 'REFERRAL', 'SOCIAL', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NONE', 'NEW_LEAD', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ClientActivityType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'TAG_ADDED', 'TAG_REMOVED', 'OFFER_CREATED', 'BOOKING_CREATED', 'MESSAGE_SENT', 'LOGIN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('CHARGE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('ADMIN_MANUAL', 'SYSTEM', 'WEBHOOK', 'IMPORT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CARD', 'ONLINE', 'OTHER', 'TRANSFER', 'TERMINAL', 'BLIK');

-- CreateEnum
CREATE TYPE "PaymentScheduleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'PARTIALLY_RETURNED', 'RETURNED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INVOICE', 'PROFORMA', 'RECEIPT', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "MessageTrigger" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PRE_ARRIVAL', 'CHECK_IN_DAY', 'POST_CHECKOUT', 'PAYMENT_RECEIVED', 'PAYMENT_REMINDER', 'OFFER_SENT', 'OFFER_EXPIRING');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('BOOKING_COM', 'AIRBNB', 'GOOGLE_HOTELS', 'ICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('PUSH', 'PULL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookLogStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "avatar" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Zielone Wzgórza',
    "legalName" TEXT,
    "nip" TEXT,
    "regon" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Warsaw',
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "locale" TEXT NOT NULL DEFAULT 'pl-PL',
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "paymentDeadlineHours" INTEGER NOT NULL DEFAULT 24,
    "paymentDeadlineAction" TEXT NOT NULL DEFAULT 'CANCEL',
    "requiredDepositPercent" INTEGER NOT NULL DEFAULT 30,
    "minInstallmentAmount" INTEGER NOT NULL DEFAULT 10000,
    "overdueNotificationHours" INTEGER NOT NULL DEFAULT 12,
    "paymentMethodsConfig" JSONB NOT NULL DEFAULT '[]',
    "paymentBankTransfer" BOOLEAN NOT NULL DEFAULT true,
    "paymentOnline" BOOLEAN NOT NULL DEFAULT true,
    "paymentCash" BOOLEAN NOT NULL DEFAULT true,
    "senderEmail" TEXT,
    "senderName" TEXT NOT NULL DEFAULT 'Zielone Wzgórza',
    "replyToEmail" TEXT,
    "bankAccountName" TEXT NOT NULL DEFAULT 'Grupa Truszkowscy sp. z o.o.',
    "bankAccountIban" TEXT NOT NULL DEFAULT '89 1090 1102 0000 0001 5948 7356',
    "bankName" TEXT NOT NULL DEFAULT 'Santander Bank Polska',
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "maxReminders" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaxType" NOT NULL DEFAULT 'PERCENTAGE',
    "rate" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ResourceCategoryType" NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkInTimeOverride" TEXT,
    "checkOutTimeOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "unitNumber" TEXT,
    "description" TEXT,
    "shortDesc" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER,
    "totalUnits" INTEGER NOT NULL DEFAULT 1,
    "area" DECIMAL(65,30),
    "floor" INTEGER,
    "location" TEXT,
    "unitDuration" INTEGER,
    "minPersons" INTEGER,
    "maxPersons" INTEGER,
    "durationMinutes" INTEGER,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "seasonStart" INTEGER,
    "seasonEnd" INTEGER,
    "visibleInWidget" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_variants" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "unitNumber" TEXT,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "basePrice" DECIMAL(65,30),
    "basePriceMinor" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_images" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_amenities" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "AddonScope" NOT NULL DEFAULT 'GLOBAL',
    "pricingType" "AddonPricingType" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "selectType" "AddonSelectType" NOT NULL DEFAULT 'CHECKBOX',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'standard',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "color" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_plans" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "modifierType" "RatePlanModifier",
    "modifierValue" DECIMAL(65,30),
    "modifierValueMinor" INTEGER,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'FLEXIBLE',
    "cancellationDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_entries" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "seasonId" TEXT,
    "date" DATE,
    "price" DECIMAL(65,30) NOT NULL,
    "priceMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PriceRuleType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "minPersons" INTEGER,
    "maxPersons" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restrictions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "minNights" INTEGER,
    "maxNights" INTEGER,
    "allowedArrivalDays" TEXT,
    "allowedDepartureDays" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "discountValueMinor" INTEGER NOT NULL DEFAULT 0,
    "minBookingValue" DECIMAL(65,30),
    "minBookingValueMinor" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_periods" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "reason" "BlockReason" NOT NULL,
    "note" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_cache" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "bookedUnits" INTEGER NOT NULL DEFAULT 0,
    "blockedUnits" INTEGER NOT NULL DEFAULT 0,
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "minPrice" DECIMAL(65,30),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" TEXT NOT NULL,
    "type" "TimelineEntryType" NOT NULL,
    "status" "TimelineEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "resourceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "quantityReserved" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "note" TEXT,
    "reservationId" TEXT,
    "reservationItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "ReservationType" NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "propertyId" TEXT,
    "requiresAttention" BOOLEAN NOT NULL DEFAULT false,
    "requiresAttentionReason" TEXT,
    "paymentStatus" "ResPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "overdue" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "assignedUserId" TEXT,
    "source" "ReservationSource" NOT NULL DEFAULT 'PHONE',
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "requiredDepositMinor" INTEGER NOT NULL DEFAULT 0,
    "requiredDepositRuleSnapshot" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "guestNotes" TEXT,
    "internalNotes" TEXT,
    "promoCodeId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cancelledBy" TEXT,
    "paymentDeadlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_items" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "categoryType" "ResourceCategoryType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerUnit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pricePerUnitMinor" INTEGER NOT NULL DEFAULT 0,
    "totalPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "capacityOverride" BOOLEAN NOT NULL DEFAULT false,
    "priceSnapshot" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_details" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "pin" TEXT,
    "expiresAt" TIMESTAMP(3),
    "expiryAction" "ExpiryAction" NOT NULL DEFAULT 'CANCEL',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "offer_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_details" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "balanceDueMinor" INTEGER NOT NULL DEFAULT 0,
    "overpaidAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "confirmedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "token" TEXT,
    "consentAcceptedAt" TIMESTAMP(3),
    "consentTermsVersion" TEXT,
    "consentIpAddress" TEXT,
    "consentUserAgent" TEXT,
    "paymentReminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastPaymentReminderAt" TIMESTAMP(3),

    CONSTRAINT "booking_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "type" "EmailLogType" NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "reservationId" TEXT,
    "templateType" TEXT,
    "triggerSource" TEXT NOT NULL DEFAULT 'SYSTEM',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_addons" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "reservationItemId" TEXT,
    "addonId" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "snapshotPrice" DECIMAL(65,30) NOT NULL,
    "snapshotPricingType" "AddonPricingType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "calcPersons" INTEGER NOT NULL DEFAULT 1,
    "calcNights" INTEGER NOT NULL DEFAULT 1,
    "calcQuantity" INTEGER NOT NULL DEFAULT 1,
    "total" DECIMAL(65,30) NOT NULL,
    "snapshotPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "unitPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_status_logs" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "fromStatus" "ReservationStatus",
    "toStatus" "ReservationStatus" NOT NULL,
    "fromType" "ReservationType",
    "toType" "ReservationType",
    "action" TEXT,
    "note" TEXT,
    "changedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_notes" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_guests" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "GuestType" NOT NULL DEFAULT 'ADULT',
    "age" INTEGER,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_price_snapshots" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "ratePlanName" TEXT,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "nightPrices" JSONB NOT NULL,
    "addonsBreakdown" JSONB,
    "discountBreakdown" JSONB,
    "taxBreakdown" JSONB,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_taxes" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "taxConfigId" TEXT NOT NULL,
    "taxName" TEXT NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_tasks" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "resourceId" TEXT,
    "assigneeId" TEXT,
    "status" "CleaningStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "clientNumber" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "phoneSecondary" TEXT,
    "emailSecondary" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "language" TEXT NOT NULL DEFAULT 'pl',
    "companyName" TEXT,
    "nip" TEXT,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "segment" "ClientSegment" NOT NULL DEFAULT 'STANDARD',
    "source" "ClientSource" NOT NULL DEFAULT 'MANUAL',
    "assignedUserId" TEXT,
    "discountStandard" DECIMAL(65,30),
    "discountPromo" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "leadStatus" "LeadStatus" NOT NULL DEFAULT 'NONE',
    "blockReason" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_stats" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalNights" INTEGER NOT NULL DEFAULT 0,
    "averageSpend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "firstBookingAt" TIMESTAMP(3),
    "lastBookingAt" TIMESTAMP(3),
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "loyaltyTier" TEXT NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_billing_profiles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "nip" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_billing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_guest_profiles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sameAsClient" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PL',
    "language" TEXT NOT NULL DEFAULT 'pl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_guest_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_consents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "phoneContact" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "consentIp" TEXT,
    "consentVersion" TEXT,
    "consentSource" TEXT,
    "consentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_tags" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_activities" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "action" "ClientActivityType" NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "activitySource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_notes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "kind" "PaymentKind",
    "direction" "PaymentDirection",
    "paymentStatus" "PaymentStatus",
    "createdByUserId" TEXT,
    "createdSource" "PaymentSource" DEFAULT 'ADMIN_MANUAL',
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "amountMinor" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "method" "PaymentMethod" NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "linkedPaymentId" TEXT,
    "externalCorrelationId" TEXT,
    "provider" TEXT,
    "providerPaymentId" TEXT,
    "webhookEventId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "collectedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'INVOICE',
    "issueDate" DATE NOT NULL,
    "dueDate" DATE,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "grossAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "trigger" "MessageTrigger",
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "type" "MessageType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "payload" JSONB,
    "retriesCount" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "title" TEXT,
    "message" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "logoUrl" TEXT,
    "logoHeight" INTEGER NOT NULL DEFAULT 40,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "primaryForeground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "foregroundColor" TEXT NOT NULL DEFAULT '#1E293B',
    "cardColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "mutedColor" TEXT NOT NULL DEFAULT '#64748B',
    "borderColor" TEXT NOT NULL DEFAULT '#E2E8F0',
    "successColor" TEXT NOT NULL DEFAULT '#16A34A',
    "warningColor" TEXT NOT NULL DEFAULT '#D97706',
    "dangerColor" TEXT NOT NULL DEFAULT '#DC2626',
    "fontFamily" TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showAvailability" BOOLEAN NOT NULL DEFAULT true,
    "maxGuestsFilter" INTEGER NOT NULL DEFAULT 20,
    "enabledPaymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customCss" TEXT,
    "termsUrl" TEXT,
    "privacyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "propertyId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_mappings" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalUrl" TEXT,
    "syncPrices" BOOLEAN NOT NULL DEFAULT true,
    "syncAvailability" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_sync_logs" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "type" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "details" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "status" "WebhookLogStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "resource_categories_slug_key" ON "resource_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_propertyId_idx" ON "resources"("propertyId");

-- CreateIndex
CREATE INDEX "resources_categoryId_idx" ON "resources"("categoryId");

-- CreateIndex
CREATE INDEX "resources_status_idx" ON "resources"("status");

-- CreateIndex
CREATE UNIQUE INDEX "resource_variants_slug_key" ON "resource_variants"("slug");

-- CreateIndex
CREATE INDEX "resource_variants_resourceId_idx" ON "resource_variants"("resourceId");

-- CreateIndex
CREATE INDEX "resource_images_resourceId_idx" ON "resource_images"("resourceId");

-- CreateIndex
CREATE INDEX "resource_amenities_resourceId_idx" ON "resource_amenities"("resourceId");

-- CreateIndex
CREATE INDEX "addons_scope_isActive_idx" ON "addons"("scope", "isActive");

-- CreateIndex
CREATE INDEX "seasons_propertyId_idx" ON "seasons"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_plans_slug_key" ON "rate_plans"("slug");

-- CreateIndex
CREATE INDEX "rate_plans_propertyId_idx" ON "rate_plans"("propertyId");

-- CreateIndex
CREATE INDEX "price_entries_variantId_ratePlanId_idx" ON "price_entries"("variantId", "ratePlanId");

-- CreateIndex
CREATE INDEX "price_entries_date_idx" ON "price_entries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "price_entries_variantId_ratePlanId_date_key" ON "price_entries"("variantId", "ratePlanId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "blocked_periods_resourceId_startDate_endDate_idx" ON "blocked_periods"("resourceId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "availability_cache_date_idx" ON "availability_cache"("date");

-- CreateIndex
CREATE INDEX "availability_cache_resourceId_date_idx" ON "availability_cache"("resourceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "availability_cache_resourceId_date_key" ON "availability_cache"("resourceId", "date");

-- CreateIndex
CREATE INDEX "calendar_events_startDate_endDate_idx" ON "calendar_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "timeline_entries_resourceId_startAt_endAt_idx" ON "timeline_entries"("resourceId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "timeline_entries_type_status_idx" ON "timeline_entries"("type", "status");

-- CreateIndex
CREATE INDEX "timeline_entries_reservationId_idx" ON "timeline_entries"("reservationId");

-- CreateIndex
CREATE INDEX "timeline_entries_reservationItemId_idx" ON "timeline_entries"("reservationItemId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_number_key" ON "reservations"("number");

-- CreateIndex
CREATE INDEX "reservations_propertyId_idx" ON "reservations"("propertyId");

-- CreateIndex
CREATE INDEX "reservations_clientId_idx" ON "reservations"("clientId");

-- CreateIndex
CREATE INDEX "reservations_assignedUserId_idx" ON "reservations"("assignedUserId");

-- CreateIndex
CREATE INDEX "reservations_type_status_idx" ON "reservations"("type", "status");

-- CreateIndex
CREATE INDEX "reservations_checkIn_checkOut_idx" ON "reservations"("checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "reservations_number_idx" ON "reservations"("number");

-- CreateIndex
CREATE INDEX "reservations_source_idx" ON "reservations"("source");

-- CreateIndex
CREATE INDEX "reservations_createdAt_idx" ON "reservations"("createdAt");

-- CreateIndex
CREATE INDEX "reservations_paymentStatus_idx" ON "reservations"("paymentStatus");

-- CreateIndex
CREATE INDEX "reservations_overdue_idx" ON "reservations"("overdue");

-- CreateIndex
CREATE INDEX "reservation_items_reservationId_idx" ON "reservation_items"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_items_resourceId_idx" ON "reservation_items"("resourceId");

-- CreateIndex
CREATE INDEX "reservation_items_categoryType_idx" ON "reservation_items"("categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "offer_details_reservationId_key" ON "offer_details"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_details_token_key" ON "offer_details"("token");

-- CreateIndex
CREATE UNIQUE INDEX "booking_details_reservationId_key" ON "booking_details"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_details_token_key" ON "booking_details"("token");

-- CreateIndex
CREATE INDEX "email_logs_reservationId_type_idx" ON "email_logs"("reservationId", "type");

-- CreateIndex
CREATE INDEX "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_type_key" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "reservation_addons_reservationId_idx" ON "reservation_addons"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_addons_reservationItemId_idx" ON "reservation_addons"("reservationItemId");

-- CreateIndex
CREATE INDEX "reservation_status_logs_reservationId_idx" ON "reservation_status_logs"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_status_logs_createdAt_idx" ON "reservation_status_logs"("createdAt");

-- CreateIndex
CREATE INDEX "reservation_notes_reservationId_idx" ON "reservation_notes"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_guests_reservationId_idx" ON "reservation_guests"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_price_snapshots_reservationId_key" ON "reservation_price_snapshots"("reservationId");

-- CreateIndex
CREATE INDEX "reservation_taxes_reservationId_idx" ON "reservation_taxes"("reservationId");

-- CreateIndex
CREATE INDEX "cleaning_tasks_status_idx" ON "cleaning_tasks"("status");

-- CreateIndex
CREATE INDEX "cleaning_tasks_scheduledAt_idx" ON "cleaning_tasks"("scheduledAt");

-- CreateIndex
CREATE INDEX "operational_tasks_status_idx" ON "operational_tasks"("status");

-- CreateIndex
CREATE INDEX "operational_tasks_dueDate_idx" ON "operational_tasks"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientNumber_key" ON "clients"("clientNumber");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_segment_idx" ON "clients"("segment");

-- CreateIndex
CREATE INDEX "clients_clientNumber_idx" ON "clients"("clientNumber");

-- CreateIndex
CREATE INDEX "clients_assignedUserId_idx" ON "clients"("assignedUserId");

-- CreateIndex
CREATE INDEX "clients_source_idx" ON "clients"("source");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_clientId_key" ON "client_accounts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_email_key" ON "client_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_stats_clientId_key" ON "client_stats"("clientId");

-- CreateIndex
CREATE INDEX "client_billing_profiles_clientId_idx" ON "client_billing_profiles"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_guest_profiles_clientId_key" ON "client_guest_profiles"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_consents_clientId_key" ON "client_consents"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "client_tags_clientId_idx" ON "client_tags"("clientId");

-- CreateIndex
CREATE INDEX "client_tags_tagId_idx" ON "client_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "client_tags_clientId_tagId_key" ON "client_tags"("clientId", "tagId");

-- CreateIndex
CREATE INDEX "client_activities_clientId_idx" ON "client_activities"("clientId");

-- CreateIndex
CREATE INDEX "client_activities_createdAt_idx" ON "client_activities"("createdAt");

-- CreateIndex
CREATE INDEX "client_activities_action_idx" ON "client_activities"("action");

-- CreateIndex
CREATE INDEX "client_notes_clientId_idx" ON "client_notes"("clientId");

-- CreateIndex
CREATE INDEX "payments_reservationId_idx" ON "payments"("reservationId");

-- CreateIndex
CREATE INDEX "payments_paymentStatus_idx" ON "payments"("paymentStatus");

-- CreateIndex
CREATE INDEX "payment_schedules_reservationId_idx" ON "payment_schedules"("reservationId");

-- CreateIndex
CREATE INDEX "payment_schedules_dueDate_idx" ON "payment_schedules"("dueDate");

-- CreateIndex
CREATE INDEX "payment_schedules_status_idx" ON "payment_schedules"("status");

-- CreateIndex
CREATE INDEX "deposits_reservationId_idx" ON "deposits"("reservationId");

-- CreateIndex
CREATE INDEX "quotes_expiresAt_idx" ON "quotes"("expiresAt");

-- CreateIndex
CREATE INDEX "quotes_payloadHash_idx" ON "quotes"("payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_reservationId_idx" ON "invoices"("reservationId");

-- CreateIndex
CREATE INDEX "message_logs_reservationId_idx" ON "message_logs"("reservationId");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "notifications_recipientType_recipientId_idx" ON "notifications"("recipientType", "recipientId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notification_events_eventType_idx" ON "notification_events"("eventType");

-- CreateIndex
CREATE INDEX "notification_events_entityType_entityId_idx" ON "notification_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notification_events_processed_idx" ON "notification_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "channel_mappings_channelId_resourceId_key" ON "channel_mappings"("channelId", "resourceId");

-- CreateIndex
CREATE INDEX "channel_sync_logs_channelId_idx" ON "channel_sync_logs"("channelId");

-- CreateIndex
CREATE INDEX "channel_sync_logs_createdAt_idx" ON "channel_sync_logs"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_logs_webhookId_idx" ON "webhook_logs"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_logs_createdAt_idx" ON "webhook_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "resource_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_variants" ADD CONSTRAINT "resource_variants_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_images" ADD CONSTRAINT "resource_images_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_amenities" ADD CONSTRAINT "resource_amenities_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "rate_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "resource_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "rate_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_periods" ADD CONSTRAINT "blocked_periods_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_cache" ADD CONSTRAINT "availability_cache_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_reservationItemId_fkey" FOREIGN KEY ("reservationItemId") REFERENCES "reservation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_details" ADD CONSTRAINT "offer_details_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_details" ADD CONSTRAINT "booking_details_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_addons" ADD CONSTRAINT "reservation_addons_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_addons" ADD CONSTRAINT "reservation_addons_reservationItemId_fkey" FOREIGN KEY ("reservationItemId") REFERENCES "reservation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_addons" ADD CONSTRAINT "reservation_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_status_logs" ADD CONSTRAINT "reservation_status_logs_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_notes" ADD CONSTRAINT "reservation_notes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_notes" ADD CONSTRAINT "reservation_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_guests" ADD CONSTRAINT "reservation_guests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_price_snapshots" ADD CONSTRAINT "reservation_price_snapshots_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_taxes" ADD CONSTRAINT "reservation_taxes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_taxes" ADD CONSTRAINT "reservation_taxes_taxConfigId_fkey" FOREIGN KEY ("taxConfigId") REFERENCES "tax_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_tasks" ADD CONSTRAINT "cleaning_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_tasks" ADD CONSTRAINT "operational_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_stats" ADD CONSTRAINT "client_stats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_billing_profiles" ADD CONSTRAINT "client_billing_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_guest_profiles" ADD CONSTRAINT "client_guest_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_consents" ADD CONSTRAINT "client_consents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_linkedPaymentId_fkey" FOREIGN KEY ("linkedPaymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_mappings" ADD CONSTRAINT "channel_mappings_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_mappings" ADD CONSTRAINT "channel_mappings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_sync_logs" ADD CONSTRAINT "channel_sync_logs_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

