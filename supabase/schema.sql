-- =============================================
-- 古籍工具集 Supabase 数据库初始化脚本
-- =============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 枚举类型
-- =============================================

CREATE TYPE user_role AS ENUM ('guest', 'user', 'vip', 'pro', 'admin');
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'past_due');

-- =============================================
-- 用户扩展信息表
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  plan plan_type DEFAULT 'free',
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_plan ON profiles(plan);

-- RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以读取自己的信息
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用户可以更新自己的信息（但不能改角色和计划）
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以更新所有用户
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 用户配额表
-- =============================================

CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 10,
  daily_used INTEGER DEFAULT 0,
  daily_reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  monthly_limit INTEGER DEFAULT 200,
  monthly_used INTEGER DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);

-- RLS 策略
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quota" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all quotas" ON user_quotas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 工具策略表
-- =============================================

CREATE TABLE tool_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id VARCHAR(100) NOT NULL UNIQUE,
  tool_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  guest_allowed BOOLEAN DEFAULT TRUE,
  guest_free_count INTEGER DEFAULT 3,
  login_required BOOLEAN DEFAULT FALSE,
  min_plan plan_type DEFAULT 'free',
  credit_cost INTEGER DEFAULT 1,
  enabled BOOLEAN DEFAULT TRUE,
  daily_limit INTEGER,
  rate_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_tool_policies_tool_id ON tool_policies(tool_id);
CREATE INDEX idx_tool_policies_category ON tool_policies(category);

-- RLS 策略
ALTER TABLE tool_policies ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取工具策略
CREATE POLICY "Anyone can view tool policies" ON tool_policies
  FOR SELECT USING (TRUE);

-- 只有管理员可以修改
CREATE POLICY "Admins can manage tool policies" ON tool_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 使用记录表
-- =============================================

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id VARCHAR(50),
  tool_id VARCHAR(100) NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  credit_cost INTEGER DEFAULT 1,
  input_size INTEGER,
  output_size INTEGER,
  duration INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_guest_id ON usage_records(guest_id);
CREATE INDEX idx_usage_records_tool_id ON usage_records(tool_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at);

-- RLS 策略
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的记录
CREATE POLICY "Users can view own records" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- 允许插入记录（包括游客）
CREATE POLICY "Anyone can insert records" ON usage_records
  FOR INSERT WITH CHECK (TRUE);

-- 管理员可以查看所有记录
CREATE POLICY "Admins can view all records" ON usage_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 订阅表
-- =============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan plan_type DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_provider VARCHAR(50),
  payment_id VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 策略
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 邀请码表
-- =============================================

CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bonus_credits INTEGER DEFAULT 10,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX idx_invite_codes_code ON invite_codes(code);

-- RLS 策略
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unused codes" ON invite_codes
  FOR SELECT USING (used_by IS NULL);

CREATE POLICY "Users can use codes" ON invite_codes
  FOR UPDATE USING (used_by IS NULL)
  WITH CHECK (auth.uid() = used_by);

-- =============================================
-- 触发器：自动创建用户 profile 和配额
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建 profile
  INSERT INTO profiles (id, username, role, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'user',
    'free'
  );
  
  -- 创建配额
  INSERT INTO user_quotas (user_id, daily_limit, monthly_limit)
  VALUES (NEW.id, 10, 200);
  
  -- 创建订阅记录
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 函数：扣减配额
-- =============================================

CREATE OR REPLACE FUNCTION deduct_quota(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota user_quotas%ROWTYPE;
BEGIN
  -- 获取当前配额
  SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否超限
  IF v_quota.daily_limit != -1 AND v_quota.daily_used + p_amount > v_quota.daily_limit THEN
    RETURN FALSE;
  END IF;
  
  IF v_quota.monthly_limit != -1 AND v_quota.monthly_used + p_amount > v_quota.monthly_limit THEN
    RETURN FALSE;
  END IF;
  
  -- 扣减
  UPDATE user_quotas
  SET 
    daily_used = daily_used + p_amount,
    monthly_used = monthly_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 函数：重置每日配额（定时任务调用）
-- =============================================

CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS VOID AS $$
BEGIN
  UPDATE user_quotas
  SET 
    daily_used = 0,
    daily_reset_at = CURRENT_DATE + INTERVAL '1 day',
    updated_at = NOW()
  WHERE daily_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 初始化工具策略数据
-- =============================================

INSERT INTO tool_policies (tool_id, tool_name, category, guest_allowed, guest_free_count, min_plan, credit_cost) VALUES
  ('remove-finger', '去手指阴影', 'input', TRUE, 3, 'free', 1),
  ('deskew', '自动纠偏', 'input', TRUE, 3, 'free', 1),
  ('ocr-vertical', '竖排OCR', 'input', TRUE, 3, 'free', 2),
  ('punctuation', '自动句读', 'input', TRUE, 3, 'free', 1),
  ('convert', '繁简转换', 'input', TRUE, 5, 'free', 1),
  ('background-unify', '背景统一/匀光', 'clean', TRUE, 3, 'free', 1),
  ('inpaint', '蠹鱼眼修复', 'clean', TRUE, 3, 'basic', 2),
  ('super-resolution', 'AI超分', 'clean', TRUE, 2, 'basic', 3),
  ('extract-seal', '印章提取', 'clean', TRUE, 3, 'free', 1),
  ('vertical-horizontal', '竖横排转换', 'read', TRUE, 5, 'free', 1),
  ('dictionary', '划词释义', 'read', TRUE, 10, 'free', 1),
  ('tts', '古文朗读', 'read', TRUE, 3, 'free', 1),
  ('variant-search', '异体字搜索', 'search', TRUE, 10, 'free', 1),
  ('diff-compare', '版本对比', 'search', TRUE, 3, 'free', 1),
  ('dual-layer-pdf', '双层PDF', 'export', TRUE, 2, 'basic', 3),
  ('epub', 'EPUB生成', 'export', TRUE, 2, 'basic', 2),
  ('long-image', '长图生成', 'export', TRUE, 3, 'free', 1),
  ('glyph-evolution', '字形演变', 'pro', TRUE, 5, 'free', 1),
  ('rhyme-check', '押韵检测', 'pro', TRUE, 5, 'free', 1),
  ('color-palette', '古画色卡', 'pro', TRUE, 3, 'free', 1)
ON CONFLICT (tool_id) DO NOTHING;

-- =============================================
-- 用户反馈表
-- =============================================

CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'question', 'other');
CREATE TYPE feedback_status AS ENUM ('pending', 'processing', 'resolved', 'closed');

CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type feedback_type NOT NULL DEFAULT 'bug',
  content TEXT NOT NULL,
  contact VARCHAR(200),
  page_url VARCHAR(500),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  status feedback_status DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_type ON feedbacks(type);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- RLS 策略
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- 任何人都可以提交反馈
CREATE POLICY "Anyone can insert feedback" ON feedbacks
  FOR INSERT WITH CHECK (TRUE);

-- 用户可以查看自己的反馈
CREATE POLICY "Users can view own feedback" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以查看和管理所有反馈
CREATE POLICY "Admins can manage all feedbacks" ON feedbacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
