-- ============================================================
-- IT-qan — تحديث v28: تعبئة صفحة "الكورسات" بالكورسات الحالية
--   (SEO / سوشيال ميديا / ميديا باير تحت قسم E-Marketing، وUI/UX،
--   والمونتاج، والبرمجة، والتصميم تحت قسم graphic)
--
--   ملحوظة: أي كورس كان له أكتر من رابط واحد (زي "دبلومة السيو
--   الشاملة" أو "احترف الاوتوميشن") تم تقسيمه لأكتر من صف مرقّم
--   (الجزء 1 / الجزء 2 ...) — لأن عمود url بياخد رابط واحد بس لكل صف.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v27_fix_courses_table.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- تأكيد وجود الأقسام المطلوبة (لو محذوفة أو معدّلة الاسم لأي سبب) —
-- الأقسام دي أصلاً متوقع تكون موجودة من v26، السطر ده مجرد أمان إضافي
-- ------------------------------------------------------------

insert into public.course_categories (title, "order")
select v.title, v.ord
from (values ('E-Marketing', 1), ('UI/UX', 2), ('Montage', 3), ('Programming', 4), ('graphic', 5)) as v(title, ord)
where not exists (select 1 from public.course_categories where title = v.title);

-- ------------------------------------------------------------
-- قسم E-Marketing (SEO / سوشيال ميديا / ميديا باير)
-- ------------------------------------------------------------

insert into public.courses (title, url, "categoryId", branch) values
('مقدمة عن السيو وتعلم السيو بعصر الذكاء الإصطناعى', 'https://youtu.be/gNFVTdJWp7w?si=xFaX2BntJ4BG9341', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('اسرار السيو - كيف تصبح رقم #1 وتحقق ارباح كبيرة عبر الانترنت', 'https://t.me/c/3638976727/14', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('سيو منصة ايزيتي', 'https://t.me/c/3638976727/11', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('دبلومة السيو الشاملة 2023 - حسن عصام (الجزء 1)', 'https://t.me/c/3638976727/39', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('دبلومة السيو الشاملة 2023 - حسن عصام (الجزء 2)', 'https://t.me/c/3638976727/40', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('دورة إحتراف تسلق نتائج البحث على جوجل - دبلومة السيو', 'https://t.me/c/3638976727/33', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('دورة سيو عربي', 'https://t.me/c/3638976727/10', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('احترف السيو مستوى 4 - دراسة المنافسين Competitor Research', 'https://t.me/c/3638976727/6', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('What Is SEO – Learn SEO Basics & Optimize Your Website', 'https://t.me/c/3638976727/9', (select id from public.course_categories where title = 'E-Marketing'), 'SEO'),
('كورس اعلانات الانستجرام و الفيسبوك', 'https://t.me/c/3638976727/13', (select id from public.course_categories where title = 'E-Marketing'), 'Social Media Specialist'),
('دورة اعلانات منصة تويتر', 'https://t.me/c/3638976727/17', (select id from public.course_categories where title = 'E-Marketing'), 'Social Media Specialist'),
('ادارة حسابات التواصل الإجتماعي - منصة ايزيتي', 'https://t.me/c/3638976727/28', (select id from public.course_categories where title = 'E-Marketing'), 'social media management'),
('Media buyer mind shift (الجزء 1)', 'https://t.me/c/3638976727/29', (select id from public.course_categories where title = 'E-Marketing'), 'Media buyer'),
('Media buyer mind shift (الجزء 2)', 'https://t.me/c/3638976727/30', (select id from public.course_categories where title = 'E-Marketing'), 'Media buyer'),
('Media buyer mind shift (الجزء 3)', 'https://t.me/c/3638976727/31', (select id from public.course_categories where title = 'E-Marketing'), 'Media buyer'),
('دورة التسويق الالكتروني الأقوى: اطلق حملات ناجحة من الآن', 'https://www.udemy.com/course/digitallmarketing/?couponCode=ABDO100&fbclid=IwY2xjawSQXvFleHRuA2FlbQIxMABicmlkETE0T2tSU3BWd0x6bGR2OVdLc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHtEdssMlzoGdp80t02WHdK8zVzgm-iucrZOyV07YH8i9i5NwL0TnGBtUTBMt_aem_O9LW3dtw6oU4Ih6JywXeaQ', (select id from public.course_categories where title = 'E-Marketing'), 'Media buyer');

-- ------------------------------------------------------------
-- قسم UI/UX
-- ------------------------------------------------------------

insert into public.courses (title, url, "categoryId", branch) values
('كورس الفيجما', 'https://t.me/c/3638976727/7', (select id from public.course_categories where title = 'UI/UX'), 'Figma'),
('Learn Figma Like a pro – Mixed with UI/UX Arabic 2022 (الجزء 1)', 'https://t.me/c/3638976727/34', (select id from public.course_categories where title = 'UI/UX'), 'Figma'),
('Learn Figma Like a pro – Mixed with UI/UX Arabic 2022 (الجزء 2)', 'https://t.me/c/3638976727/35', (select id from public.course_categories where title = 'UI/UX'), 'Figma'),
('Learn Figma Like a pro – Mixed with UI/UX Arabic 2022 (الجزء 3)', 'https://t.me/c/3638976727/36', (select id from public.course_categories where title = 'UI/UX'), 'Figma'),
('أساسيات تصميم UI/UX', 'https://yanfaa.com/eg/single/fundamentals_of_ui_ux', (select id from public.course_categories where title = 'UI/UX'), null);

-- ------------------------------------------------------------
-- قسم المونتاج (Montage)
-- ------------------------------------------------------------

insert into public.courses (title, url, "categoryId", branch) values
('كورس المونتاج - بريمير', 'https://t.me/c/3638976727/23', (select id from public.course_categories where title = 'Montage'), null),
('كورس مونتاج بريمير - عمرو عطالله', 'https://t.me/c/3638976727/25', (select id from public.course_categories where title = 'Montage'), null),
('كورس المونتاج الشامل مبتدئ - إحترافي - محسن فؤاد', 'https://t.me/c/3638976727/37', (select id from public.course_categories where title = 'Montage'), null);

-- ------------------------------------------------------------
-- قسم البرمجة (Programming)
-- ------------------------------------------------------------

insert into public.courses (title, url, "categoryId", branch) values
('مبادئ ووردبريس - WordPress - منصة ايزيتى (الجزء 1)', 'https://t.me/c/3638976727/3', (select id from public.course_categories where title = 'Programming'), null),
('مبادئ ووردبريس - WordPress - منصة ايزيتى (الجزء 2)', 'https://t.me/c/3638976727/4', (select id from public.course_categories where title = 'Programming'), null),
('C# OOP Essentials', 'https://t.me/c/3638976727/2', (select id from public.course_categories where title = 'Programming'), null),
('احترف الاوتوميشن بالذكاء الإصطناعى (الجزء 1)', 'https://t.me/c/3638976727/18', (select id from public.course_categories where title = 'Programming'), null),
('احترف الاوتوميشن بالذكاء الإصطناعى (الجزء 2)', 'https://t.me/c/3638976727/19', (select id from public.course_categories where title = 'Programming'), null),
('احترف الاوتوميشن بالذكاء الإصطناعى (الجزء 3)', 'https://t.me/c/3638976727/20', (select id from public.course_categories where title = 'Programming'), null),
('احترف الاوتوميشن بالذكاء الإصطناعى (الجزء 4)', 'https://t.me/c/3638976727/21', (select id from public.course_categories where title = 'Programming'), null);

-- ------------------------------------------------------------
-- قسم التصميم (graphic)
-- ------------------------------------------------------------

insert into public.courses (title, url, "categoryId", branch) values
('Design Thinking', 'https://yanfaa.com/eg/single/Design_Thinking2', (select id from public.course_categories where title = 'graphic'), null),
('الألوان', 'https://yanfaa.com/eg/single/The-Geometry-of%20Color-Harmony', (select id from public.course_categories where title = 'graphic'), null),
('كورس احتراف كانفا', 'https://t.me/c/3638976727/27', (select id from public.course_categories where title = 'graphic'), null),
('احترف التصميم باستخدام Canva', 'https://yanfaa.com/eg/single/professional_design_using_Canva', (select id from public.course_categories where title = 'graphic'), null),
('أساسيات الفوتوشوب', 'https://yanfaa.com/eg/single/Basics-of-photoshop', (select id from public.course_categories where title = 'graphic'), null),
('تصميمات السوشيال ميديا', 'https://yanfaa.com/eg/single/Social-Media-Designs', (select id from public.course_categories where title = 'graphic'), null),
('أساسيات الاليستريتور', 'https://yanfaa.com/eg/single/Basics-of-illustrator', (select id from public.course_categories where title = 'graphic'), null),
('حرفة صناعة الشعار', 'https://yanfaa.com/eg/single/Logo-Crafting', (select id from public.course_categories where title = 'graphic'), null),
('عناصر التصميم الجرافيكي', 'https://yanfaa.com/eg/single/Elements_Of_Graphic_Design', (select id from public.course_categories where title = 'graphic'), null);

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) العدد الكلي: 40 صف (16 في E-Marketing، 5 في UI/UX، 3 في Montage،
--    7 في Programming، 9 في graphic).
--
-- 2) لو شغّلت الملف ده أكتر من مرة بالغلط، هتتكرر كل الكورسات تاني
--    (مفيش unique constraint على العنوان/الرابط يمنع التكرار) — لو
--    حصل كده وعايز تمسح التكرار، قولّي.
--
-- 3) لو عايز تعدّل أي عنوان/رابط/فرع بعد كده، أسهل حاجة من واجهة
--    "الكورسات" نفسها (زرار تعديل جنب كل صف) — مش محتاج ترجع لـ SQL.
-- ============================================================
