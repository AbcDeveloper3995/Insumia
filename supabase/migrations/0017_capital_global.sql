-- 1. Añadir campo capital_actual a la tabla restaurantes
ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS capital_actual NUMERIC NOT NULL DEFAULT 0;

-- 2. Crear tabla de movimientos_capital
CREATE TABLE IF NOT EXISTS movimientos_capital (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('inversion_inicial', 'cierre_caja', 'compra_proveedor', 'pago_nomina', 'ajuste', 'otros')),
    concepto TEXT NOT NULL,
    referencia_id UUID, -- Referencia opcional (ej. id de la caja, id de la compra)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trigger para actualizar el capital_actual del restaurante automáticamente
CREATE OR REPLACE FUNCTION actualizar_capital_restaurante()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'ingreso' THEN
        UPDATE restaurantes 
        SET capital_actual = capital_actual + NEW.monto
        WHERE id = NEW.restaurante_id;
    ELSIF NEW.tipo = 'egreso' THEN
        UPDATE restaurantes 
        SET capital_actual = capital_actual - NEW.monto
        WHERE id = NEW.restaurante_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_actualizar_capital ON movimientos_capital;
CREATE TRIGGER trigger_actualizar_capital
AFTER INSERT ON movimientos_capital
FOR EACH ROW
EXECUTE FUNCTION actualizar_capital_restaurante();

-- 4. Habilitar RLS en la nueva tabla
ALTER TABLE movimientos_capital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver movimientos de capital de su restaurante"
ON movimientos_capital FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = movimientos_capital.restaurante_id AND ur.usuario_id = auth.uid())
);

CREATE POLICY "Usuarios pueden insertar movimientos de capital en su restaurante"
ON movimientos_capital FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuario_restaurantes ur WHERE ur.restaurante_id = movimientos_capital.restaurante_id AND ur.usuario_id = auth.uid())
);
