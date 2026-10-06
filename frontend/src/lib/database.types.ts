
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "alerta_gestiones": {
                  Row: {
                    "alerta_id": string,"autor_id": string | null,"creada_at": string,"id": string,"nota": string | null,"organization_id": string,"tipo": string
                  }
                  Insert: {
                    "alerta_id": string,"autor_id"?: string | null,"creada_at"?: string,"id"?: string,"nota"?: string | null,"organization_id": string,"tipo": string
                  }
                  Update: {
                    "alerta_id"?: string,"autor_id"?: string | null,"creada_at"?: string,"id"?: string,"nota"?: string | null,"organization_id"?: string,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alerta_gestiones_alerta_id_fkey"
      columns: ["alerta_id"]
isOneToOne: false
      referencedRelation: "alertas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alerta_gestiones_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alerta_gestiones_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"alertas": {
                  Row: {
                    "agotamiento_estimado": string | null,"cobertura_dias": number | null,"confirmada_at": string | null,"creada_at": string,"critica_at": string | null,"dato_at": string | null,"estado": Database["public"]['Enums']["estado_alerta"],"fuente": Database["public"]['Enums']["fuente_consumo"],"id": string,"organization_id": string,"point_id": string,"pospuesta_hasta": string | null,"producto_id": string,"resuelta_at": string | null,"severidad": Database["public"]['Enums']["severidad_alerta"],"updated_at": string
                  }
                  Insert: {
                    "agotamiento_estimado"?: string | null,"cobertura_dias"?: number | null,"confirmada_at"?: string | null,"creada_at"?: string,"critica_at"?: string | null,"dato_at"?: string | null,"estado"?: Database["public"]['Enums']["estado_alerta"],"fuente": Database["public"]['Enums']["fuente_consumo"],"id"?: string,"organization_id": string,"point_id": string,"pospuesta_hasta"?: string | null,"producto_id": string,"resuelta_at"?: string | null,"severidad": Database["public"]['Enums']["severidad_alerta"],"updated_at"?: string
                  }
                  Update: {
                    "agotamiento_estimado"?: string | null,"cobertura_dias"?: number | null,"confirmada_at"?: string | null,"creada_at"?: string,"critica_at"?: string | null,"dato_at"?: string | null,"estado"?: Database["public"]['Enums']["estado_alerta"],"fuente"?: Database["public"]['Enums']["fuente_consumo"],"id"?: string,"organization_id"?: string,"point_id"?: string,"pospuesta_hasta"?: string | null,"producto_id"?: string,"resuelta_at"?: string | null,"severidad"?: Database["public"]['Enums']["severidad_alerta"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alertas_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alertas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "actor_id": string | null,"actor_perfil": Database["public"]['Enums']["perfil"] | null,"antes": Json | null,"despues": Json | null,"id": number,"ocurrido_at": string,"operacion": string,"organization_id": string | null,"registro_id": string | null,"tabla": string
                  }
                  Insert: {
                    "actor_id"?: string | null,"actor_perfil"?: Database["public"]['Enums']["perfil"] | null,"antes"?: Json | null,"despues"?: Json | null,"id"?: never,"ocurrido_at"?: string,"operacion": string,"organization_id"?: string | null,"registro_id"?: string | null,"tabla": string
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_perfil"?: Database["public"]['Enums']["perfil"] | null,"antes"?: Json | null,"despues"?: Json | null,"id"?: never,"ocurrido_at"?: string,"operacion"?: string,"organization_id"?: string | null,"registro_id"?: string | null,"tabla"?: string
                  }
                  Relationships: [
                    
                  ]
                },"consumo_referencia": {
                  Row: {
                    "canal": Database["public"]['Enums']["canal"],"kg_dia": number
                  }
                  Insert: {
                    "canal": Database["public"]['Enums']["canal"],"kg_dia": number
                  }
                  Update: {
                    "canal"?: Database["public"]['Enums']["canal"],"kg_dia"?: number
                  }
                  Relationships: [
                    
                  ]
                },"crm_empresas": {
                  Row: {
                    "asignado_a": string | null,"canal": Database["public"]['Enums']["canal"],"estado": Database["public"]['Enums']["estado_empresa_crm"],"razon_social": string,"rut": string,"segmento": string | null,"updated_at": string
                  }
                  Insert: {
                    "asignado_a"?: string | null,"canal": Database["public"]['Enums']["canal"],"estado"?: Database["public"]['Enums']["estado_empresa_crm"],"razon_social": string,"rut": string,"segmento"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "asignado_a"?: string | null,"canal"?: Database["public"]['Enums']["canal"],"estado"?: Database["public"]['Enums']["estado_empresa_crm"],"razon_social"?: string,"rut"?: string,"segmento"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_empresas_asignado_a_fkey"
      columns: ["asignado_a"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"declaraciones_stock": {
                  Row: {
                    "bolsas": number,"declarado_at": string,"declarado_por": string | null,"id": string,"organization_id": string,"pedido_id": string | null,"point_id": string,"producto_id": string
                  }
                  Insert: {
                    "bolsas": number,"declarado_at"?: string,"declarado_por"?: string | null,"id"?: string,"organization_id": string,"pedido_id"?: string | null,"point_id": string,"producto_id": string
                  }
                  Update: {
                    "bolsas"?: number,"declarado_at"?: string,"declarado_por"?: string | null,"id"?: string,"organization_id"?: string,"pedido_id"?: string | null,"point_id"?: string,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "declaraciones_pedido_fk"
      columns: ["pedido_id"]
isOneToOne: false
      referencedRelation: "pedidos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "declaraciones_stock_declarado_por_fkey"
      columns: ["declarado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "declaraciones_stock_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "declaraciones_stock_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "declaraciones_stock_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"entregas": {
                  Row: {
                    "bolsas": number,"entregada_at": string,"id": string,"organization_id": string,"pedido_id": string | null,"point_id": string,"producto_id": string
                  }
                  Insert: {
                    "bolsas": number,"entregada_at"?: string,"id"?: string,"organization_id": string,"pedido_id"?: string | null,"point_id": string,"producto_id": string
                  }
                  Update: {
                    "bolsas"?: number,"entregada_at"?: string,"id"?: string,"organization_id"?: string,"pedido_id"?: string | null,"point_id"?: string,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entregas_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entregas_pedido_fk"
      columns: ["pedido_id"]
isOneToOne: false
      referencedRelation: "pedidos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entregas_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "entregas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"envios_correo": {
                  Row: {
                    "avisos": number,"email": string,"enviado_at": string,"id": number,"modo": string,"proveedor_id": string | null,"user_id": string | null
                  }
                  Insert: {
                    "avisos": number,"email": string,"enviado_at"?: string,"id"?: never,"modo": string,"proveedor_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "avisos"?: number,"email"?: string,"enviado_at"?: string,"id"?: never,"modo"?: string,"proveedor_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "envios_correo_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"historial_pedido": {
                  Row: {
                    "estado": Database["public"]['Enums']["estado_pedido"],"id": number,"ocurrido_at": string,"organization_id": string,"pedido_id": string
                  }
                  Insert: {
                    "estado": Database["public"]['Enums']["estado_pedido"],"id"?: never,"ocurrido_at"?: string,"organization_id": string,"pedido_id": string
                  }
                  Update: {
                    "estado"?: Database["public"]['Enums']["estado_pedido"],"id"?: never,"ocurrido_at"?: string,"organization_id"?: string,"pedido_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "historial_pedido_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "historial_pedido_pedido_id_fkey"
      columns: ["pedido_id"]
isOneToOne: false
      referencedRelation: "pedidos"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "aceptada_at": string | null,"created_at": string,"email": string,"estado": Database["public"]['Enums']["estado_invitacion"],"expires_at": string,"id": string,"invitado_por": string | null,"nombre": string,"organization_id": string,"perfil": Database["public"]['Enums']["perfil"]
                  }
                  Insert: {
                    "aceptada_at"?: string | null,"created_at"?: string,"email": string,"estado"?: Database["public"]['Enums']["estado_invitacion"],"expires_at"?: string,"id"?: string,"invitado_por"?: string | null,"nombre": string,"organization_id": string,"perfil": Database["public"]['Enums']["perfil"]
                  }
                  Update: {
                    "aceptada_at"?: string | null,"created_at"?: string,"email"?: string,"estado"?: Database["public"]['Enums']["estado_invitacion"],"expires_at"?: string,"id"?: string,"invitado_por"?: string | null,"nombre"?: string,"organization_id"?: string,"perfil"?: Database["public"]['Enums']["perfil"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_invitado_por_fkey"
      columns: ["invitado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"lecturas_telemetria": {
                  Row: {
                    "bebidas": number,"fecha": string,"gramos_por_bebida": number,"id": number,"kg": number | null,"organization_id": string,"point_id": string,"recibida_at": string
                  }
                  Insert: {
                    "bebidas": number,"fecha": string,"gramos_por_bebida": number,"id"?: never,"kg"?: never,"organization_id": string,"point_id": string,"recibida_at"?: string
                  }
                  Update: {
                    "bebidas"?: number,"fecha"?: string,"gramos_por_bebida"?: number,"id"?: never,"kg"?: never,"organization_id"?: string,"point_id"?: string,"recibida_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lecturas_telemetria_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lecturas_telemetria_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    }
                  ]
                },"lineas_pedido": {
                  Row: {
                    "bolsas": number,"id": string,"organization_id": string,"pedido_id": string,"producto_id": string
                  }
                  Insert: {
                    "bolsas": number,"id"?: string,"organization_id": string,"pedido_id": string,"producto_id": string
                  }
                  Update: {
                    "bolsas"?: number,"id"?: string,"organization_id"?: string,"pedido_id"?: string,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lineas_pedido_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_pedido_pedido_id_fkey"
      columns: ["pedido_id"]
isOneToOne: false
      referencedRelation: "pedidos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_pedido_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"lineas_sugeridas": {
                  Row: {
                    "bolsas": number,"bolsas_sugeridas": number,"id": string,"organization_id": string,"pedido_sugerido_id": string,"producto_id": string
                  }
                  Insert: {
                    "bolsas": number,"bolsas_sugeridas": number,"id"?: string,"organization_id": string,"pedido_sugerido_id": string,"producto_id": string
                  }
                  Update: {
                    "bolsas"?: number,"bolsas_sugeridas"?: number,"id"?: string,"organization_id"?: string,"pedido_sugerido_id"?: string,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lineas_sugeridas_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_sugeridas_pedido_sugerido_id_fkey"
      columns: ["pedido_sugerido_id"]
isOneToOne: false
      referencedRelation: "pedidos_sugeridos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_sugeridas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"machines": {
                  Row: {
                    "created_at": string,"id": string,"modelo": string,"numero_serie": string,"point_id": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"modelo": string,"numero_serie": string,"point_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"modelo"?: string,"numero_serie"?: string,"point_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "machines_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"estado": Database["public"]['Enums']["estado_membresia"],"invitacion_id": string | null,"organization_id": string,"perfil": Database["public"]['Enums']["perfil"],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_membresia"],"invitacion_id"?: string | null,"organization_id": string,"perfil": Database["public"]['Enums']["perfil"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_membresia"],"invitacion_id"?: string | null,"organization_id"?: string,"perfil"?: Database["public"]['Enums']["perfil"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_invitacion_id_fkey"
      columns: ["invitacion_id"]
isOneToOne: false
      referencedRelation: "invitations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mezcla_punto": {
                  Row: {
                    "bolsas_habituales": number,"organization_id": string,"point_id": string,"producto_id": string,"proporcion": number
                  }
                  Insert: {
                    "bolsas_habituales": number,"organization_id": string,"point_id": string,"producto_id": string,"proporcion": number
                  }
                  Update: {
                    "bolsas_habituales"?: number,"organization_id"?: string,"point_id"?: string,"producto_id"?: string,"proporcion"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "mezcla_punto_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mezcla_punto_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mezcla_punto_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"notificaciones": {
                  Row: {
                    "alerta_id": string | null,"correo_enviado_at": string | null,"creada_at": string,"cuerpo": string,"detalle": string | null,"enlace": string,"id": string,"leida_at": string | null,"organization_id": string | null,"pedido_id": string | null,"por_correo": boolean,"tipo": string,"titulo": string,"user_id": string
                  }
                  Insert: {
                    "alerta_id"?: string | null,"correo_enviado_at"?: string | null,"creada_at"?: string,"cuerpo": string,"detalle"?: string | null,"enlace": string,"id"?: string,"leida_at"?: string | null,"organization_id"?: string | null,"pedido_id"?: string | null,"por_correo"?: boolean,"tipo": string,"titulo": string,"user_id": string
                  }
                  Update: {
                    "alerta_id"?: string | null,"correo_enviado_at"?: string | null,"creada_at"?: string,"cuerpo"?: string,"detalle"?: string | null,"enlace"?: string,"id"?: string,"leida_at"?: string | null,"organization_id"?: string | null,"pedido_id"?: string | null,"por_correo"?: boolean,"tipo"?: string,"titulo"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notificaciones_alerta_id_fkey"
      columns: ["alerta_id"]
isOneToOne: false
      referencedRelation: "alertas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notificaciones_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notificaciones_pedido_id_fkey"
      columns: ["pedido_id"]
isOneToOne: false
      referencedRelation: "pedidos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notificaciones_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "activada_por": string | null,"contacto_email": string | null,"contacto_nombre": string | null,"contacto_telefono": string | null,"created_at": string,"id": string,"nombre_comercial": string,"razon_social": string,"rut": string | null,"tipo": Database["public"]['Enums']["tipo_organizacion"],"updated_at": string
                  }
                  Insert: {
                    "activada_por"?: string | null,"contacto_email"?: string | null,"contacto_nombre"?: string | null,"contacto_telefono"?: string | null,"created_at"?: string,"id"?: string,"nombre_comercial": string,"razon_social": string,"rut"?: string | null,"tipo": Database["public"]['Enums']["tipo_organizacion"],"updated_at"?: string
                  }
                  Update: {
                    "activada_por"?: string | null,"contacto_email"?: string | null,"contacto_nombre"?: string | null,"contacto_telefono"?: string | null,"created_at"?: string,"id"?: string,"nombre_comercial"?: string,"razon_social"?: string,"rut"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_organizacion"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_activada_por_fkey"
      columns: ["activada_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizations_rut_fkey"
      columns: ["rut"]
isOneToOne: true
      referencedRelation: "crm_empresas"
      referencedColumns: ["rut"]
    }
                  ]
                },"parametros_reposicion": {
                  Row: {
                    "dias_ciclo": number,"gestion_dias": number,"id": boolean,"margen_dias": number,"plazo_regiones_dias": number,"plazo_rm_dias": number,"umbral_critico_dias": number,"ventana_telemetria_dias": number
                  }
                  Insert: {
                    "dias_ciclo"?: number,"gestion_dias"?: number,"id"?: boolean,"margen_dias"?: number,"plazo_regiones_dias"?: number,"plazo_rm_dias"?: number,"umbral_critico_dias"?: number,"ventana_telemetria_dias"?: number
                  }
                  Update: {
                    "dias_ciclo"?: number,"gestion_dias"?: number,"id"?: boolean,"margen_dias"?: number,"plazo_regiones_dias"?: number,"plazo_rm_dias"?: number,"umbral_critico_dias"?: number,"ventana_telemetria_dias"?: number
                  }
                  Relationships: [
                    
                  ]
                },"pedidos": {
                  Row: {
                    "alerta_id": string | null,"codigo": string,"confirmado_at": string,"confirmado_por": string | null,"confirmado_por_nombre": string | null,"estado": Database["public"]['Enums']["estado_pedido"],"id": string,"organization_id": string,"pedido_sugerido_id": string | null,"point_id": string,"updated_at": string
                  }
                  Insert: {
                    "alerta_id"?: string | null,"codigo"?: string,"confirmado_at"?: string,"confirmado_por"?: string | null,"confirmado_por_nombre"?: string | null,"estado"?: Database["public"]['Enums']["estado_pedido"],"id"?: string,"organization_id": string,"pedido_sugerido_id"?: string | null,"point_id": string,"updated_at"?: string
                  }
                  Update: {
                    "alerta_id"?: string | null,"codigo"?: string,"confirmado_at"?: string,"confirmado_por"?: string | null,"confirmado_por_nombre"?: string | null,"estado"?: Database["public"]['Enums']["estado_pedido"],"id"?: string,"organization_id"?: string,"pedido_sugerido_id"?: string | null,"point_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pedidos_alerta_id_fkey"
      columns: ["alerta_id"]
isOneToOne: true
      referencedRelation: "alertas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_confirmado_por_fkey"
      columns: ["confirmado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_pedido_sugerido_id_fkey"
      columns: ["pedido_sugerido_id"]
isOneToOne: true
      referencedRelation: "pedidos_sugeridos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    }
                  ]
                },"pedidos_sugeridos": {
                  Row: {
                    "ajustado_at": string | null,"ajustado_por": string | null,"ajustado_por_nombre": string | null,"ajustado_por_perfil": Database["public"]['Enums']["perfil"] | null,"alerta_id": string,"creado_at": string,"id": string,"organization_id": string,"point_id": string
                  }
                  Insert: {
                    "ajustado_at"?: string | null,"ajustado_por"?: string | null,"ajustado_por_nombre"?: string | null,"ajustado_por_perfil"?: Database["public"]['Enums']["perfil"] | null,"alerta_id": string,"creado_at"?: string,"id"?: string,"organization_id": string,"point_id": string
                  }
                  Update: {
                    "ajustado_at"?: string | null,"ajustado_por"?: string | null,"ajustado_por_nombre"?: string | null,"ajustado_por_perfil"?: Database["public"]['Enums']["perfil"] | null,"alerta_id"?: string,"creado_at"?: string,"id"?: string,"organization_id"?: string,"point_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pedidos_sugeridos_ajustado_por_fkey"
      columns: ["ajustado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_sugeridos_alerta_id_fkey"
      columns: ["alerta_id"]
isOneToOne: true
      referencedRelation: "alertas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_sugeridos_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_sugeridos_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    }
                  ]
                },"points": {
                  Row: {
                    "activo": boolean,"canal": Database["public"]['Enums']["canal"],"contacto_recepcion": string | null,"created_at": string,"direccion": string | null,"horario": string | null,"id": string,"nombre": string,"organization_id": string,"partner_org_id": string | null,"telemetria_disponible": boolean,"updated_at": string,"zona": Database["public"]['Enums']["zona_entrega"]
                  }
                  Insert: {
                    "activo"?: boolean,"canal": Database["public"]['Enums']["canal"],"contacto_recepcion"?: string | null,"created_at"?: string,"direccion"?: string | null,"horario"?: string | null,"id"?: string,"nombre": string,"organization_id": string,"partner_org_id"?: string | null,"telemetria_disponible"?: boolean,"updated_at"?: string,"zona"?: Database["public"]['Enums']["zona_entrega"]
                  }
                  Update: {
                    "activo"?: boolean,"canal"?: Database["public"]['Enums']["canal"],"contacto_recepcion"?: string | null,"created_at"?: string,"direccion"?: string | null,"horario"?: string | null,"id"?: string,"nombre"?: string,"organization_id"?: string,"partner_org_id"?: string | null,"telemetria_disponible"?: boolean,"updated_at"?: string,"zona"?: Database["public"]['Enums']["zona_entrega"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "points_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "points_partner_org_id_fkey"
      columns: ["partner_org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"productos": {
                  Row: {
                    "activo": boolean,"formato": string,"id": string,"kg_por_bolsa": number,"nombre": string,"sku": string
                  }
                  Insert: {
                    "activo"?: boolean,"formato": string,"id"?: string,"kg_por_bolsa": number,"nombre": string,"sku": string
                  }
                  Update: {
                    "activo"?: boolean,"formato"?: string,"id"?: string,"kg_por_bolsa"?: number,"nombre"?: string,"sku"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"nombre": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"email": string,"id": string,"nombre": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"nombre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"role_permissions": {
                  Row: {
                    "perfil": Database["public"]['Enums']["perfil"],"permiso": string
                  }
                  Insert: {
                    "perfil": Database["public"]['Enums']["perfil"],"permiso": string
                  }
                  Update: {
                    "perfil"?: Database["public"]['Enums']["perfil"],"permiso"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saldos": {
                  Row: {
                    "agotamiento_estimado": string | null,"calculado_at": string,"cobertura_dias": number | null,"consumo_diario_kg": number | null,"dato_at": string | null,"fuente": Database["public"]['Enums']["fuente_consumo"],"organization_id": string,"point_id": string,"producto_id": string,"saldo_kg": number
                  }
                  Insert: {
                    "agotamiento_estimado"?: string | null,"calculado_at"?: string,"cobertura_dias"?: number | null,"consumo_diario_kg"?: number | null,"dato_at"?: string | null,"fuente": Database["public"]['Enums']["fuente_consumo"],"organization_id": string,"point_id": string,"producto_id": string,"saldo_kg": number
                  }
                  Update: {
                    "agotamiento_estimado"?: string | null,"calculado_at"?: string,"cobertura_dias"?: number | null,"consumo_diario_kg"?: number | null,"dato_at"?: string | null,"fuente"?: Database["public"]['Enums']["fuente_consumo"],"organization_id"?: string,"point_id"?: string,"producto_id"?: string,"saldo_kg"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "saldos_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saldos_point_id_fkey"
      columns: ["point_id"]
isOneToOne: false
      referencedRelation: "points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saldos_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "aceptar_invitacion":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["perfil"]
                           },
"activar_empresa":
{ Args: { "p_rut": string }; Returns: string
                           },
"ajustar_pedido_sugerido":
{ Args: { "p_lineas": Json,"p_sugerido": string }; Returns: undefined
                           },
"avanzar_pedido":
{ Args: { "p_codigo": string,"p_estado"?: Database["public"]['Enums']["estado_pedido"] }; Returns: Database["public"]['Enums']["estado_pedido"]
                           },
"cambiar_estado_miembro":
{ Args: { "p_activo": boolean,"p_user": string }; Returns: Database["public"]['Enums']["estado_membresia"]
                           },
"confirmar_pedido":
{ Args: { "p_quedan"?: Json,"p_sugerido": string }; Returns: {
              "codigo": string,"pedido_id": string
            }[]
                           },
"crear_invitacion":
{ Args: { "p_email": string,"p_nombre": string,"p_org": string,"p_perfil": Database["public"]['Enums']["perfil"] }; Returns: {
              "invitacion_id": string,"reemplazar_usuario": string
            }[]
                           },
"marcar_notificaciones_leidas":
{ Args: { "p_ids"?: (string)[] }; Returns: number
                           },
"mi_ejecutivo":
{ Args: Record<PropertyKey, never>; Returns: {
              "email": string,"nombre": string,"perfil": Database["public"]['Enums']["perfil"]
            }[]
                           },
"mi_sesion":
{ Args: Record<PropertyKey, never>; Returns: {
              "email": string,"estado": Database["public"]['Enums']["estado_membresia"],"nombre": string,"organizacion_nombre": string,"organizacion_tipo": Database["public"]['Enums']["tipo_organizacion"],"organization_id": string,"perfil": Database["public"]['Enums']["perfil"],"permisos": (string)[],"user_id": string
            }[]
                           },
"posponer_alerta":
{ Args: { "p_alerta": string,"p_dias"?: number }; Returns: undefined
                           },
"recalcular_reposicion":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"registrar_envio_correo":
{ Args: { "p_email": string,"p_ids": (string)[],"p_modo": string,"p_proveedor_id": string,"p_user": string }; Returns: undefined
                           },
"registrar_gerencia_inicial":
{ Args: { "p_email": string,"p_nombre": string }; Returns: string
                           },
"registrar_gestion":
{ Args: { "p_alerta": string,"p_nota"?: string,"p_tipo": string }; Returns: undefined
                           },
"resumenes_correo_pendientes":
{ Args: { "p_limite_diario"?: number }; Returns: {
              "avisos": Json,"email": string,"nombre": string,"user_id": string
            }[]
                           },
"revocar_invitacion":
{ Args: { "p_invitacion": string }; Returns: undefined
                           }
          }
          Enums: {
            "canal": "horeca"|"ocs"|"conveniencia"|"panaderia","estado_alerta": "abierta"|"pospuesta"|"critica"|"confirmada"|"resuelta","estado_empresa_crm": "activa"|"suspendida","estado_invitacion": "pendiente"|"aceptada"|"revocada","estado_membresia": "invitada"|"activa"|"desactivada","estado_pedido": "recibido"|"en_preparacion"|"en_reparto"|"entregado","fuente_consumo": "telemetria"|"declarado","perfil": "gerencia"|"vendedor"|"kam"|"cliente_admin"|"cliente_integrante"|"partner","severidad_alerta": "amarilla"|"roja","tipo_organizacion": "marley"|"cliente"|"partner","zona_entrega": "rm"|"regiones"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "canal": ["horeca", "ocs", "conveniencia", "panaderia"],"estado_alerta": ["abierta", "pospuesta", "critica", "confirmada", "resuelta"],"estado_empresa_crm": ["activa", "suspendida"],"estado_invitacion": ["pendiente", "aceptada", "revocada"],"estado_membresia": ["invitada", "activa", "desactivada"],"estado_pedido": ["recibido", "en_preparacion", "en_reparto", "entregado"],"fuente_consumo": ["telemetria", "declarado"],"perfil": ["gerencia", "vendedor", "kam", "cliente_admin", "cliente_integrante", "partner"],"severidad_alerta": ["amarilla", "roja"],"tipo_organizacion": ["marley", "cliente", "partner"],"zona_entrega": ["rm", "regiones"]
          }
        }
} as const
