CREATE TABLE store_inventory (
  store_id   varchar(8)  NOT NULL,
  sku        varchar(20) NOT NULL,
  on_hand    int         NOT NULL,
  reserved   int         NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (store_id, sku)
);
CREATE TABLE reservation (
  reservation_id uuid PRIMARY KEY,
  order_id   varchar(20) NOT NULL,
  store_id   varchar(8)  NOT NULL,
  sku        varchar(20) NOT NULL,
  qty        int         NOT NULL CHECK (qty > 0),
  expires_at timestamptz NOT NULL,
  status     varchar(12) NOT NULL
);
CREATE INDEX CONCURRENTLY ix_reservation_expires ON reservation (expires_at);
CREATE INDEX CONCURRENTLY ix_reservation_order ON reservation (order_id);
