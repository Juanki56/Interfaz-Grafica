 '[2, 3]', '[3]',
    '["Cascadas Escondidas", "Valle de los Frailejones", "3 noches en Villa Verde Ecológica", "Todas las comidas orgánicas", "Guías naturalistas", "Transporte 4x4", "Talleres de conservación"]',
    'Moderado', 'Naturaleza', TRUE);

-- Insertar servicios
INSERT INTO servicios (nombre, categoria, descripcion, precio, duracion, capacidad, estado, proveedor, telefono) VALUES
('Transporte Terrestre 4x4', 'transporte', 'Servicio de transporte en vehículos 4x4 para rutas de aventura', 50000, 'Por trayecto', 8, 'Activo', 'Transportes Quindío', '+57 300 123 4567'),
('Guía Especializado Certificado', 'guia', 'Guía turístico certificado con experiencia en ecoturismo', 80000, 'Por día', 15, 'Activo', 'Occitours', '+57 310 234 5678'),
('Alimentación Completa', 'alimentacion', 'Desayuno, almuerzo y cena tradicional colombiana', 35000, 'Por persona/día', 50, 'Activo', 'Restaurante Local', '+57 320 345 6789'),
('Seguro de Aventura', 'otros', 'Cobertura para actividades de riesgo durante tours', 15000, 'Por persona', 100, 'Activo', 'Seguros Colombia', '+57 315 456 7890'),
('Equipo de Senderismo', 'equipo', 'Bastones, mochilas, linternas y equipo básico', 25000, 'Por día', 20, 'Activo', 'Deportes Extremos SAS', '+57 301 567 8901');

-- Insertar transporte
INSERT INTO transporte (tipo_vehiculo, placa, capacidad, conductor, telefono_conductor, estado, ultimo_mantenimiento, proximo_mantenimiento, kilometraje) VALUES
('Bus Turístico', 'TUR-123', 25, 'Jorge Pérez', '+57 300 111 2222', 'Disponible', '2024-11-15', '2025-02-15', 45000),
('Camioneta 4x4', 'ADV-456', 8, 'Luis Gómez', '+57 315 222 3333', 'Disponible', '2024-12-01', '2025-03-01', 32000),
('Van Ejecutiva', 'EXE-789', 12, 'Roberto Silva', '+57 320 333 4444', 'Mantenimiento', '2024-12-10', '2025-03-10', 28000);

-- Insertar restaurantes
INSERT INTO restaurantes (nombre, tipo_comida, precio, descripcion, calificacion, rutas_asociadas, ubicacion, telefono, capacidad) VALUES
('Café del Sendero', 'desayuno', 20000, 'Desayuno típico colombiano con café orgánico y arepas', 4.7, '[1, 2]', 'Salento, Quindío', '+57 310 555 6666', 40),
('El Mirador Andino', 'almuerzo', 32000, 'Almuerzo completo con vista panorámica a las montañas', 4.8, '[1, 3]', 'Parque Nacional', '+57 320 666 7777', 50),
('Sabores del Páramo', 'refrigerio', 15000, 'Refrigerio con productos locales y bebidas calientes', 4.6, '[2]', 'Páramo de Sumapaz', '+57 315 777 8888', 30),
('Fogón de Montaña', 'almuerzo', 35000, 'Cocina tradicional con trucha fresca y acompañamientos típicos', 4.9, '[3]', 'Selva Tropical', '+57 301 888 9999', 35);

-- Insertar personal médico
INSERT INTO personal_medico (nombre, documento, especialidad, licencia, universidad, año_graduacion, experiencia, telefono, email, direccion, fecha_nacimiento, tipo_sangre, estado, disponibilidad, horario_trabajo, disponible_emergencias, idiomas, certificaciones, salario, tipo_contrato, fecha_inicio) VALUES
('Dr. Fernando Ruiz', '12345678', 'Medicina General', 'MED-12345', 'Universidad Nacional de Colombia', 2010, '14 años', '+57 310 111 2222', 'fernando@medicos.com', 'Calle 15 #20-30, Armenia', '1985-03-15', 'O+', 'Activo', 'Lunes a Viernes', '08:00 - 17:00', TRUE,
    '["Español", "Inglés"]',
    '["RCP Avanzado", "Medicina de Montaña", "Primeros Auxilios"]',
    3500000, 'Tiempo Completo', '2022-01-15'),

('Dra. Patricia Gómez', '87654321', 'Medicina de Emergencias', 'MED-67890', 'Universidad Pontificia Bolivariana', 2008, '16 años', '+57 320 333 4444', 'patricia@medicos.com', 'Carrera 14 #25-40, Circasia', '1983-07-22', 'A-', 'Activo', '24/7', 'Turnos rotativos', TRUE,
    '["Español", "Inglés", "Francés"]',
    '["Trauma Avanzado", "Medicina de Emergencias", "Rescate en Montaña"]',
    4200000, 'Tiempo Completo', '2021-08-01');

-- =====================================================
-- VISTAS ÚTILES PARA REPORTES
-- =====================================================

-- Vista de reservas con información completa
CREATE VIEW v_reservas_completas AS
SELECT 
    r.id,
    r.fecha_reserva,
    r.estado,
    r.estado_pago,
    r.monto_total,
    r.numero_participantes,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    c.telefono AS cliente_telefono,
    g.nombre AS guia_nombre,
    a.nombre AS asesor_nombre,
    p.nombre AS paquete_nombre,
    rt.nombre AS ruta_nombre,
    f.nombre AS finca_nombre
FROM reservas r
LEFT JOIN usuarios c ON r.cliente_id = c.id
LEFT JOIN usuarios g ON r.guia_asignado_id = g.id
LEFT JOIN usuarios a ON r.asesor_id = a.id
LEFT JOIN paquetes p ON r.paquete_id = p.id
LEFT JOIN rutas rt ON r.ruta_id = rt.id
LEFT JOIN fincas f ON r.finca_id = f.id;

-- Vista de ventas con detalles
CREATE VIEW v_ventas_detalladas AS
SELECT 
    v.id,
    v.fecha_venta,
    v.monto_total,
    v.monto_pagado,
    v.monto_pendiente,
    v.estado,
    v.tipo_venta,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    a.nombre AS asesor_nombre,
    v.nombre_servicio,
    v.tipo_servicio
FROM ventas v
LEFT JOIN usuarios c ON v.cliente_id = c.id
LEFT JOIN usuarios a ON v.asesor_id = a.id;

-- Vista de estadísticas por asesor
CREATE VIEW v_estadisticas_asesores AS
SELECT 
    a.id AS asesor_id,
    a.nombre AS asesor_nombre,
    COUNT(DISTINCT v.id) AS total_ventas,
    SUM(v.monto_total) AS monto_total_ventas,
    SUM(v.comision) AS comisiones_totales,
    COUNT(DISTINCT r.id) AS total_reservas
FROM usuarios a
LEFT JOIN ventas v ON a.id = v.asesor_id
LEFT JOIN reservas r ON a.id = r.asesor_id
WHERE a.rol = 'advisor'
GROUP BY a.id, a.nombre;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

DELIMITER //

-- Procedimiento para crear una reserva completa
CREATE PROCEDURE sp_crear_reserva(
    IN p_cliente_id INT,
    IN p_tipo_servicio VARCHAR(50),
    IN p_servicio_id INT,
    IN p_fecha_reserva DATE,
    IN p_participantes INT,
    IN p_monto_total DECIMAL(10,2),
    IN p_asesor_id INT
)
BEGIN
    DECLARE v_reserva_id INT;
    
    -- Insertar reserva
    INSERT INTO reservas (cliente_id, tipo_servicio, fecha_reserva, numero_participantes, monto_total, asesor_id, estado)
    VALUES (p_cliente_id, p_tipo_servicio, p_fecha_reserva, p_participantes, p_monto_total, p_asesor_id, 'Pendiente');
    
    SET v_reserva_id = LAST_INSERT_ID();
    
    -- Insertar venta correspondiente
    INSERT INTO ventas (reserva_id, cliente_id, tipo_servicio, fecha_venta, fecha_servicio, monto_total, monto_pendiente, asesor_id, numero_participantes)
    VALUES (v_reserva_id, p_cliente_id, p_tipo_servicio, CURDATE(), p_fecha_reserva, p_monto_total, p_monto_total, p_asesor_id, p_participantes);
    
    -- Crear notificación
    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
    VALUES (p_cliente_id, 'reserva', 'Reserva Creada', CONCAT('Tu reserva #', v_reserva_id, ' ha sido creada exitosamente'));
    
    SELECT v_reserva_id AS reserva_id;
END //

-- Procedimiento para registrar un abono
CREATE PROCEDURE sp_registrar_abono(
    IN p_venta_id INT,
    IN p_monto DECIMAL(10,2),
    IN p_metodo_pago VARCHAR(100),
    IN p_registrado_por INT
)
BEGIN
    DECLARE v_monto_pendiente DECIMAL(10,2);
    DECLARE v_cliente_id INT;
    
    -- Obtener información de la venta
    SELECT monto_pendiente, cliente_id INTO v_monto_pendiente, v_cliente_id
    FROM ventas WHERE id = p_venta_id;
    
    -- Insertar abono
    INSERT INTO abonos (venta_id, monto, metodo_pago, fecha_abono, registrado_por)
    VALUES (p_venta_id, p_monto, p_metodo_pago, CURDATE(), p_registrado_por);
    
    -- Actualizar venta
    UPDATE ventas 
    SET 
        monto_pagado = monto_pagado + p_monto,
        monto_pendiente = monto_pendiente - p_monto,
        estado = CASE 
            WHEN (monto_pendiente - p_monto) <= 0 THEN 'Pagado'
            WHEN monto_pagado + p_monto > 0 THEN 'Abono'
            ELSE estado
        END
    WHERE id = p_venta_id;
    
    -- Crear notificación
    INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje)
    VALUES (v_cliente_id, 'pago', 'Abono Registrado', CONCAT('Se ha registrado un abono de $', FORMAT(p_monto, 0), ' a tu reserva'));
END //

-- Procedimiento para obtener estadísticas del dashboard
CREATE PROCEDURE sp_estadisticas_dashboard(IN p_fecha_inicio DATE, IN p_fecha_fin DATE)
BEGIN
    -- Total de ventas
    SELECT 
        COUNT(*) AS total_ventas,
        SUM(monto_total) AS monto_total,
        SUM(CASE WHEN estado = 'Pagado' THEN monto_total ELSE 0 END) AS monto_pagado,
        SUM(monto_pendiente) AS monto_pendiente
    FROM ventas
    WHERE fecha_venta BETWEEN p_fecha_inicio AND p_fecha_fin;
    
    -- Reservas por estado
    SELECT estado, COUNT(*) AS total
    FROM reservas
    WHERE fecha_reserva BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY estado;
    
    -- Top servicios más vendidos
    SELECT 
        tipo_servicio,
        nombre_servicio,
        COUNT(*) AS cantidad_ventas,
        SUM(monto_total) AS ingresos_totales
    FROM ventas
    WHERE fecha_venta BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY tipo_servicio, nombre_servicio
    ORDER BY cantidad_ventas DESC
    LIMIT 10;
END //

DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_reservas_fecha_estado ON reservas(fecha_reserva, estado);
CREATE INDEX idx_ventas_fecha_estado ON ventas(fecha_venta, estado);
CREATE INDEX idx_servicios_categoria_estado ON servicios(categoria, estado);
CREATE INDEX idx_usuarios_rol_estado ON usuarios(rol, estado);

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Nota: Las contraseñas en los datos de ejemplo son hashes dummy.
-- En producción, debes usar bcrypt o similar para hashear las contraseñas.
-- La contraseña real para todos los usuarios demo es: password123
