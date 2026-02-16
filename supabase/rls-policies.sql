-- =============================================================================
-- VEHIRE MARKETPLACE - RLS POLICIES FOR SUPABASE
-- =============================================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS TABLE
-- =============================================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- Permitir inserción durante el registro (via trigger/function)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Admins pueden ver todos los usuarios (requiere rol ADMIN en el JWT)
-- Nota: Esto requiere configurar custom claims en Supabase Auth

-- =============================================================================
-- VEHICLES TABLE
-- =============================================================================

-- Cualquiera puede ver vehículos activos (para búsqueda pública)
CREATE POLICY "Anyone can view active vehicles"
ON vehicles FOR SELECT
USING (status = 'ACTIVE');

-- Los hosts pueden ver TODOS sus vehículos (incluyendo drafts)
CREATE POLICY "Hosts can view own vehicles"
ON vehicles FOR SELECT
USING (auth.uid()::text = "hostId");

-- Los hosts pueden crear vehículos
CREATE POLICY "Hosts can create vehicles"
ON vehicles FOR INSERT
WITH CHECK (auth.uid()::text = "hostId");

-- Los hosts pueden actualizar sus vehículos
CREATE POLICY "Hosts can update own vehicles"
ON vehicles FOR UPDATE
USING (auth.uid()::text = "hostId");

-- Los hosts pueden eliminar sus vehículos
CREATE POLICY "Hosts can delete own vehicles"
ON vehicles FOR DELETE
USING (auth.uid()::text = "hostId");

-- =============================================================================
-- VEHICLE_IMAGES TABLE
-- =============================================================================

-- Cualquiera puede ver imágenes de vehículos activos
CREATE POLICY "Anyone can view vehicle images"
ON vehicle_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_images."vehicleId"
    AND vehicles.status = 'ACTIVE'
  )
);

-- Los hosts pueden ver imágenes de sus vehículos
CREATE POLICY "Hosts can view own vehicle images"
ON vehicle_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_images."vehicleId"
    AND vehicles."hostId" = auth.uid()::text
  )
);

-- Los hosts pueden agregar imágenes a sus vehículos
CREATE POLICY "Hosts can insert vehicle images"
ON vehicle_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_images."vehicleId"
    AND vehicles."hostId" = auth.uid()::text
  )
);

-- Los hosts pueden eliminar imágenes de sus vehículos
CREATE POLICY "Hosts can delete vehicle images"
ON vehicle_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_images."vehicleId"
    AND vehicles."hostId" = auth.uid()::text
  )
);

-- =============================================================================
-- AVAILABILITIES TABLE
-- =============================================================================

-- Cualquiera puede ver disponibilidad de vehículos activos
CREATE POLICY "Anyone can view availability"
ON availabilities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = availabilities."vehicleId"
    AND vehicles.status = 'ACTIVE'
  )
);

-- Los hosts pueden gestionar disponibilidad de sus vehículos
CREATE POLICY "Hosts can manage availability"
ON availabilities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = availabilities."vehicleId"
    AND vehicles."hostId" = auth.uid()::text
  )
);

-- =============================================================================
-- BOOKINGS TABLE
-- =============================================================================

-- Los drivers pueden ver sus reservas
CREATE POLICY "Drivers can view own bookings"
ON bookings FOR SELECT
USING (auth.uid()::text = "driverId");

-- Los hosts pueden ver reservas de sus vehículos
CREATE POLICY "Hosts can view own vehicle bookings"
ON bookings FOR SELECT
USING (auth.uid()::text = "hostId");

-- Los usuarios autenticados pueden crear reservas
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid()::text = "driverId");

-- Los drivers pueden actualizar sus reservas (cancelar)
CREATE POLICY "Drivers can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid()::text = "driverId");

-- Los hosts pueden actualizar reservas de sus vehículos
CREATE POLICY "Hosts can update vehicle bookings"
ON bookings FOR UPDATE
USING (auth.uid()::text = "hostId");

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================

-- Los usuarios pueden ver sus pagos (como driver o host)
CREATE POLICY "Users can view related payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = payments."bookingId"
    AND (bookings."driverId" = auth.uid()::text OR bookings."hostId" = auth.uid()::text)
  )
);

-- Solo el sistema puede crear/actualizar pagos (via service role)
-- No crear políticas INSERT/UPDATE para pagos

-- =============================================================================
-- REVIEWS TABLE
-- =============================================================================

-- Cualquiera puede ver reviews públicas
CREATE POLICY "Anyone can view public reviews"
ON reviews FOR SELECT
USING ("isPublic" = true);

-- Los usuarios pueden ver reviews que dieron o recibieron
CREATE POLICY "Users can view own reviews"
ON reviews FOR SELECT
USING (
  auth.uid()::text = "reviewerId" OR auth.uid()::text = "revieweeId"
);

-- Los usuarios autenticados pueden crear reviews
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid()::text = "reviewerId");

-- =============================================================================
-- KYC_DOCUMENTS TABLE
-- =============================================================================

-- Los usuarios pueden ver sus propios documentos
CREATE POLICY "Users can view own KYC documents"
ON kyc_documents FOR SELECT
USING (auth.uid()::text = "userId");

-- Los usuarios pueden subir documentos KYC
CREATE POLICY "Users can upload KYC documents"
ON kyc_documents FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Solo admins pueden actualizar (aprobar/rechazar)
-- Esto requiere una política separada con custom claims
-- Por ahora, usar service role para admin operations

-- =============================================================================
-- STORAGE POLICIES - vehicle-images bucket
-- =============================================================================

-- Política para ver imágenes de vehículos (público)
CREATE POLICY "Public can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Los hosts pueden subir imágenes a sus carpetas
CREATE POLICY "Hosts can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND auth.role() = 'authenticated'
);

-- Los hosts pueden actualizar sus imágenes
CREATE POLICY "Hosts can update vehicle images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vehicle-images'
  AND auth.role() = 'authenticated'
);

-- Los hosts pueden eliminar sus imágenes
CREATE POLICY "Hosts can delete vehicle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images'
  AND auth.role() = 'authenticated'
);

-- =============================================================================
-- STORAGE POLICIES - kyc-documents bucket (privado)
-- =============================================================================

-- Los usuarios solo pueden ver sus propios documentos
CREATE POLICY "Users can view own KYC docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden subir documentos KYC
CREATE POLICY "Users can upload KYC docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- STORAGE POLICIES - avatars bucket
-- =============================================================================

-- Cualquiera puede ver avatares (público)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Los usuarios pueden subir su avatar
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden actualizar su avatar
CREATE POLICY "Users can update avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- CONVERSATIONS & MESSAGES TABLES
-- =============================================================================

-- Los usuarios pueden ver sus conversaciones
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (auth.uid()::text = "userId");

-- Los usuarios pueden crear conversaciones
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Los usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages."conversationId"
    AND conversations."userId" = auth.uid()::text
  )
);

-- Los usuarios pueden crear mensajes en sus conversaciones
CREATE POLICY "Users can create messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages."conversationId"
    AND conversations."userId" = auth.uid()::text
  )
);

-- =============================================================================
-- INCIDENTS TABLE
-- =============================================================================

-- Los usuarios pueden ver incidentes de sus reservas
CREATE POLICY "Users can view own incidents"
ON incidents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = incidents."bookingId"
    AND (bookings."driverId" = auth.uid()::text OR bookings."hostId" = auth.uid()::text)
  )
);

-- Los usuarios pueden reportar incidentes
CREATE POLICY "Users can report incidents"
ON incidents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = incidents."bookingId"
    AND (bookings."driverId" = auth.uid()::text OR bookings."hostId" = auth.uid()::text)
  )
);

-- =============================================================================
-- HELPER FUNCTIONS (opcional)
-- =============================================================================

-- Función para verificar si un usuario es admin
-- CREATE OR REPLACE FUNCTION is_admin()
-- RETURNS BOOLEAN AS $$
--   SELECT EXISTS (
--     SELECT 1 FROM users
--     WHERE id = auth.uid()::text
--     AND 'ADMIN' = ANY(roles)
--   );
-- $$ LANGUAGE SQL SECURITY DEFINER;

-- Función para obtener el folder name de un path
-- (Ya existe en Supabase por defecto: storage.foldername())

-- =============================================================================
-- NOTAS IMPORTANTES
-- =============================================================================
--
-- 1. POLÍTICAS DE ADMIN:
--    Las operaciones de admin (aprobar KYC, aprobar vehículos) requieren
--    usar el service_role key o configurar custom claims en Supabase Auth.
--
-- 2. STORAGE:
--    Asegúrate de que los buckets estén creados:
--    - vehicle-images (public)
--    - kyc-documents (private)
--    - avatars (public)
--
-- 3. TESTING:
--    Para probar las políticas, usa el botón "Test RLS policies" en Supabase.
--
-- 4. SERVICE ROLE:
--    Las operaciones del backend (webhooks, cron jobs) deben usar
--    el service_role key para bypass RLS.
--
-- =============================================================================
