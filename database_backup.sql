-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: rent_management_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `property_id` varchar(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `event_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES ('3004c134-6408-11f1-a09c-f4390977436c','633cbc84-ca05-4ad5-87b5-3ee07df83b31','zxcv',' nbvc','2b185dfe-6247-11f1-a5bf-f4390977436c','2026-06-09 13:36:15','2026-06-12','16:39:00','22:36:00'),('bd1d28d4-6246-11f1-a5bf-f4390977436c','48319690-66a4-4112-8666-ede996010320','Water interuption','water to be cut out','5f2c4c52-5fe8-11f1-a5bf-f4390977436c','2026-06-07 07:58:58','2026-06-07','10:59:00','11:00:00');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caretaker_invites`
--

DROP TABLE IF EXISTS `caretaker_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caretaker_invites` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `invite_code` varchar(36) DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caretaker_invites`
--

LOCK TABLES `caretaker_invites` WRITE;
/*!40000 ALTER TABLE `caretaker_invites` DISABLE KEYS */;
INSERT INTO `caretaker_invites` VALUES ('0d490f45-6247-11f1-a5bf-f4390977436c','INV-F6A148',1,'2026-06-08 11:01:13','2026-06-07 08:01:13'),('1501043d-6175-11f1-a5bf-f4390977436c','INV-1F5B71',0,'2026-06-07 09:58:11','2026-06-06 06:58:11'),('1deaa319-63d6-11f1-a1ae-f4390977436c','INV-72FE4F',0,'2026-06-10 10:37:50','2026-06-09 07:37:50'),('376116cd-5fe8-11f1-a5bf-f4390977436c','INV-85D6AE',1,'2026-06-05 10:37:19','2026-06-04 07:37:19'),('75898a35-985d-4c73-8660-8315a08c4199','INV-1D199E1F',0,'2026-06-11 12:23:47','2026-06-10 09:23:47'),('77e69eb8-f379-4da7-ac19-bb17555e7653','INV-A8CC5479',0,'2026-06-10 16:15:00','2026-06-09 13:15:00'),('887a9ae3-2269-411f-baaa-3835e906943a','INV-AB6A56E6',0,'2026-06-11 12:20:57','2026-06-10 09:20:57'),('914ff116-42bd-498a-8737-bbb675a6e961','INV-C954CA54',0,'2026-06-10 16:54:31','2026-06-09 13:54:31'),('9abc5a7a-61c1-11f1-a5bf-f4390977436c','INV-D533B3',0,'2026-06-07 19:05:57','2026-06-06 16:05:57'),('b3b6b6ea-5dba-11f1-8db1-f4390977436c','INV-92005B',1,'2026-06-02 16:06:28','2026-06-01 13:06:28'),('bd897bfe-5be7-11f1-b095-f4390977436c','INV-CF5E0F',0,'2026-05-31 08:23:50','2026-05-30 05:23:50'),('dcd1ff14-52a9-4688-8b75-71549786ab69','INV-46E275AD',0,'2026-06-11 11:49:38','2026-06-10 08:49:38');
/*!40000 ALTER TABLE `caretaker_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_participants`
--

DROP TABLE IF EXISTS `conversation_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_participants` (
  `conversation_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_participants`
--

LOCK TABLES `conversation_participants` WRITE;
/*!40000 ALTER TABLE `conversation_participants` DISABLE KEYS */;
INSERT INTO `conversation_participants` VALUES ('ef3a2a58-8e91-4fb6-965d-28395ddff377','5f679235-5f03-11f1-81df-f4390977436c','2026-06-04 12:21:16'),('ef3a2a58-8e91-4fb6-965d-28395ddff377','80c8985e-5fe9-11f1-a5bf-f4390977436c','2026-06-04 12:21:16');
/*!40000 ALTER TABLE `conversation_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` varchar(36) NOT NULL,
  `type` enum('dm','group') NOT NULL DEFAULT 'dm',
  `name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES ('3ca9d9cc-b1b9-426b-b350-b7ebe604dffe','dm',NULL,'2026-06-04 12:10:46'),('7ea0629b-1a4b-4385-ac3c-47c7448d6aab','dm',NULL,'2026-06-04 12:12:29'),('960ff4eb-6e81-4d65-ab00-647b048c8821','dm',NULL,'2026-06-04 12:00:20'),('be35ceff-c154-4694-9b3e-99182554dd2e','dm',NULL,'2026-06-04 12:13:26'),('ef3a2a58-8e91-4fb6-965d-28395ddff377','dm',NULL,'2026-06-04 12:21:16');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `property_id` varchar(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(100) NOT NULL,
  `expense_date` date NOT NULL,
  `recorded_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `expenses_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('51584cd6-5dc3-11f1-8db1-f4390977436c','5c0a4ef8-5bdd-11f1-b095-f4390977436c','replaced a bulb in the house',100.00,'Electrical Spares','2026-06-01','2a114b05-5dbb-11f1-8db1-f4390977436c','2026-06-01 14:08:08'),('567237f8-6408-11f1-a09c-f4390977436c','633cbc84-ca05-4ad5-87b5-3ee07df83b31','cleaned',120.00,'Plumbing Emergency','2026-06-09','2b185dfe-6247-11f1-a5bf-f4390977436c','2026-06-09 13:37:19'),('e17dbecb-5dc5-11f1-8db1-f4390977436c','5c0a4ef8-5bdd-11f1-b095-f4390977436c','we did some cleaning in the house',150.00,'Cleaning & Janitorial','2026-06-01','2a114b05-5dbb-11f1-8db1-f4390977436c','2026-06-01 14:26:29'),('fb91be3e-6239-11f1-a5bf-f4390977436c','prop-test-001','Installed WiFi ',2000.00,'Other Petty Expenses','2026-06-07','5f2c4c52-5fe8-11f1-a5bf-f4390977436c','2026-06-07 06:27:39');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hidden_messages`
--

DROP TABLE IF EXISTS `hidden_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hidden_messages` (
  `user_id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `hidden_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`message_id`),
  KEY `message_id` (`message_id`),
  CONSTRAINT `hidden_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hidden_messages_ibfk_2` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hidden_messages`
--

LOCK TABLES `hidden_messages` WRITE;
/*!40000 ALTER TABLE `hidden_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `hidden_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `lease_id` varchar(36) NOT NULL,
  `rent_amount` decimal(10,2) NOT NULL,
  `utilities_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('Unpaid','Partially_Paid','Paid','Overdue','Pending') NOT NULL DEFAULT 'Unpaid',
  `due_date` date NOT NULL,
  `billing_period` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lease_id` (`lease_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`lease_id`) REFERENCES `leases` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('031b844c-6171-11f1-a5bf-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b',5000.00,400.00,5400.00,'Unpaid','2026-06-15','2026-06-01','2026-06-06 06:29:03'),('0751a4bb-61ad-11f1-a5bf-f4390977436c','fe320e05-af6b-4469-b084-93bf15e9eb11',5000.00,493.00,5493.00,'Unpaid','2026-07-10','2026-07-01','2026-06-06 13:38:40'),('22eb1e2f-5ffc-11f1-a5bf-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b',5000.00,0.00,5000.00,'Unpaid','2026-06-11','2026-06-01','2026-06-04 09:59:54'),('27740103-5be1-11f1-b095-f4390977436c','e3a545ed-5bdf-11f1-b095-f4390977436c',12000.00,1920.00,13920.00,'Unpaid','2026-06-05','2026-05-01','2026-05-30 04:36:41'),('3fdc678c-6404-11f1-a09c-f4390977436c','213a27d3-54ff-4f57-bd06-61e5b11e2211',20000.00,0.00,20000.00,'Unpaid','2026-07-10','2026-07-01','2026-06-09 13:08:03'),('4bf07a1e-5ffd-11f1-a5bf-f4390977436c','213a27d3-54ff-4f57-bd06-61e5b11e2211',20000.00,0.00,20000.00,'Unpaid','2026-06-11','2026-06-01','2026-06-04 10:08:13'),('a967636a-6171-11f1-a5bf-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b',5000.00,1000.00,6000.00,'Unpaid','2026-06-15','2026-06-01','2026-06-06 06:33:42'),('ba6e14e6-61aa-11f1-a5bf-f4390977436c','fe320e05-af6b-4469-b084-93bf15e9eb11',5000.00,0.00,5000.00,'Unpaid','2026-06-13','2026-06-01','2026-06-06 13:22:12'),('ccbde5b4-5ff2-11f1-a5bf-f4390977436c','test-lease-001',15000.00,1000.00,16000.00,'Paid','2026-06-30','2026-06-01','2026-06-04 08:53:04');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leases`
--

DROP TABLE IF EXISTS `leases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leases` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `notice_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leases_tenant_id` (`tenant_id`),
  KEY `idx_leases_unit_id` (`unit_id`),
  CONSTRAINT `leases_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `leases_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leases`
--

LOCK TABLES `leases` WRITE;
/*!40000 ALTER TABLE `leases` DISABLE KEYS */;
INSERT INTO `leases` VALUES ('213a27d3-54ff-4f57-bd06-61e5b11e2211','440128cb-5ffd-11f1-a5bf-f4390977436c','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','2026-06-04',NULL,NULL,1,'2026-06-04 10:08:13','2026-06-04 10:08:13'),('259f8a70-b477-4372-b969-06f39d9b3d1b','6d99c1bf-5ffb-11f1-a5bf-f4390977436c','51943933-8054-4581-b210-adbdfd75f2e0','2026-06-04',NULL,NULL,1,'2026-06-04 09:59:54','2026-06-04 09:59:54'),('fe320e05-af6b-4469-b084-93bf15e9eb11','b35c6430-61aa-11f1-a5bf-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','2026-06-06',NULL,NULL,1,'2026-06-06 13:22:12','2026-06-06 13:22:12'),('test-lease-001','80c8985e-5fe9-11f1-a5bf-f4390977436c','unit-test-001','2026-06-01',NULL,NULL,1,'2026-06-04 08:52:39','2026-06-04 08:52:39');
/*!40000 ALTER TABLE `leases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_tickets`
--

DROP TABLE IF EXISTS `maintenance_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_tickets` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `unit_id` varchar(36) NOT NULL,
  `reported_by` varchar(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `status` enum('Pending','In_Progress','Resolved') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `unit_id` (`unit_id`),
  KEY `reported_by` (`reported_by`),
  CONSTRAINT `maintenance_tickets_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `maintenance_tickets_ibfk_2` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_tickets`
--

LOCK TABLES `maintenance_tickets` WRITE;
/*!40000 ALTER TABLE `maintenance_tickets` DISABLE KEYS */;
INSERT INTO `maintenance_tickets` VALUES ('1db5e573-6239-11f1-a5bf-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','b35c6430-61aa-11f1-a5bf-f4390977436c','Leaking sink','My sink is leaking ',NULL,'Resolved','2026-06-07 06:21:27','2026-06-07 06:22:03','Plumbing'),('6c0ad546-64a5-11f1-95e5-f4390977436c','51943933-8054-4581-b210-adbdfd75f2e0','6d99c1bf-5ffb-11f1-a5bf-f4390977436c','Rrdd','Sssss',NULL,'Resolved','2026-06-10 08:21:46','2026-06-10 08:24:08','Electrical'),('75196232-6408-11f1-a09c-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','b35c6430-61aa-11f1-a5bf-f4390977436c','broken pipe','broken pipe',NULL,'Resolved','2026-06-09 13:38:11','2026-06-10 08:12:39','Plumbing'),('98916451-5fec-11f1-a5bf-f4390977436c','22d36e3e-c9a6-45a2-a116-069ba078b1d7','80c8985e-5fe9-11f1-a5bf-f4390977436c','leaking pipe','my pipe in the bathroom is leaking',NULL,'Resolved','2026-06-04 08:08:40','2026-06-04 08:09:16','Plumbing'),('ad1bcaff-64a5-11f1-95e5-f4390977436c','51943933-8054-4581-b210-adbdfd75f2e0','6d99c1bf-5ffb-11f1-a5bf-f4390977436c','Dggrew','Cskws',NULL,'Resolved','2026-06-10 08:23:36','2026-06-10 08:24:07','Appliance'),('d195c82b-6006-11f1-a5bf-f4390977436c','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','440128cb-5ffd-11f1-a5bf-f4390977436c','wifi installation','i need wifi installation',NULL,'Resolved','2026-06-04 11:16:22','2026-06-04 12:46:39','Electrical'),('eb8e02ae-640a-11f1-a09c-f4390977436c','51943933-8054-4581-b210-adbdfd75f2e0','6d99c1bf-5ffb-11f1-a5bf-f4390977436c','wifi','i need wifi installation in my house',NULL,'Resolved','2026-06-09 13:55:48','2026-06-10 08:24:09','Electrical');
/*!40000 ALTER TABLE `maintenance_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `content` text,
  `media_url` varchar(255) DEFAULT NULL,
  `media_type` enum('image','voice') DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES ('a8f5dfd9-d9c3-461b-8d82-5020beb87b06','ef3a2a58-8e91-4fb6-965d-28395ddff377','80c8985e-5fe9-11f1-a5bf-f4390977436c','Hello! This is my first test message.',NULL,NULL,0,'2026-06-04 12:22:56');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `invoice_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` enum('M-Pesa','Cash','Bank_Transfer') NOT NULL DEFAULT 'M-Pesa',
  `mpesa_checkout_id` varchar(100) DEFAULT NULL,
  `mpesa_receipt_number` varchar(50) DEFAULT NULL,
  `status` enum('Pending','Completed','Failed') NOT NULL DEFAULT 'Pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mpesa_checkout_id` (`mpesa_checkout_id`),
  UNIQUE KEY `mpesa_receipt_number` (`mpesa_receipt_number`),
  KEY `invoice_id` (`invoice_id`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_chk_1` CHECK ((`amount_paid` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('298a9ad1-5ff3-11f1-a5bf-f4390977436c','ccbde5b4-5ff2-11f1-a5bf-f4390977436c','80c8985e-5fe9-11f1-a5bf-f4390977436c',16000.00,'M-Pesa','ws_CO_SIM_5307b42592021454','SGF0B01DDA','Completed','2026-06-04 11:55:47','2026-06-04 08:55:40'),('efae5af7-5ff2-11f1-a5bf-f4390977436c','ccbde5b4-5ff2-11f1-a5bf-f4390977436c','80c8985e-5fe9-11f1-a5bf-f4390977436c',16000.00,'M-Pesa','ws_CO_SIM_e658844df37767bb',NULL,'Pending',NULL,'2026-06-04 08:54:03');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(100) NOT NULL,
  `location` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES ('48319690-66a4-4112-8666-ede996010320','BALAZA COMPLEX','Karatina','2026-06-04 07:17:18','2026-06-04 07:17:18'),('633cbc84-ca05-4ad5-87b5-3ee07df83b31','Air complex','Meru  Town','2026-06-03 04:16:15','2026-06-03 04:16:15'),('c5781097-1320-459e-93c0-962f53e60fea','Alpha heights','Nairobi','2026-06-10 08:44:06','2026-06-10 08:44:06'),('prop-test-001','Test Property','Test Location','2026-06-04 08:51:20','2026-06-04 08:51:20');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_invites`
--

DROP TABLE IF EXISTS `tenant_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_invites` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `invite_code` varchar(10) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `is_used` tinyint(1) DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `tenant_invites_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_invites`
--

LOCK TABLES `tenant_invites` WRITE;
/*!40000 ALTER TABLE `tenant_invites` DISABLE KEYS */;
INSERT INTO `tenant_invites` VALUES ('050169df-5d9b-11f1-84c3-f4390977436c','TNTF2644D','20c93417-5d54-11f1-84c3-f4390977436c',1,'2026-06-08 12:19:41','2026-06-01 09:19:41'),('1c61129c-5f03-11f1-81df-f4390977436c','TNT4F2CFB','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698',1,'2026-06-10 07:17:19','2026-06-03 04:17:19'),('1dcf32ca-81b1-4db2-b3f6-b9679467eb1e','TNT1E3E2','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698',0,'2026-06-17 12:24:29','2026-06-10 09:24:29'),('20107fa3-61b8-11f1-a5bf-f4390977436c','TNT7EB833','22d36e3e-c9a6-45a2-a116-069ba078b1d7',1,'2026-06-13 17:58:06','2026-06-06 14:58:06'),('29daf765-5ffd-11f1-a5bf-f4390977436c','TNT8C2221','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698',1,'2026-06-11 13:07:16','2026-06-04 10:07:15'),('32eb0e97-243e-425a-8b9c-e6d83ecbcbd3','TNT342D8','22d36e3e-c9a6-45a2-a116-069ba078b1d7',1,'2026-06-16 16:09:02','2026-06-09 13:09:02'),('3fa265cf-014f-4cc5-b935-93892954b6af','TNT44DC2','ca5ccf7f-e245-4b2a-bdb9-587f35409d38',0,'2026-06-17 12:24:06','2026-06-10 09:24:05'),('433eb765-5d54-11f1-84c3-f4390977436c','TNTBC9F91','20c93417-5d54-11f1-84c3-f4390977436c',1,'2026-06-08 03:53:11','2026-06-01 00:53:11'),('46e2b018-5ffb-11f1-a5bf-f4390977436c','TNT22B059','51943933-8054-4581-b210-adbdfd75f2e0',1,'2026-06-11 12:53:46','2026-06-04 09:53:45'),('569f749f-1d8a-4873-b239-053021638aa2','TNT5F9E9','ca5ccf7f-e245-4b2a-bdb9-587f35409d38',1,'2026-06-17 12:17:22','2026-06-10 09:17:22'),('589c9b7f-5fe9-11f1-a5bf-f4390977436c','TNTE8C13C','22d36e3e-c9a6-45a2-a116-069ba078b1d7',1,'2026-06-11 10:45:24','2026-06-04 07:45:24'),('5f629983-c1c3-4936-a9ce-3bc52a1896b6','TNTAE3CC','unit-test-001',1,'2026-06-17 12:16:32','2026-06-10 09:16:32'),('7607a031-6247-11f1-a5bf-f4390977436c','TNT6D778D','22d36e3e-c9a6-45a2-a116-069ba078b1d7',1,'2026-06-14 11:04:09','2026-06-07 08:04:08'),('79e7486a-5e6a-11f1-81df-f4390977436c','TNTA0228B','620a6646-6d4a-4cd8-9e9a-bf7ccdfd110c',0,'2026-06-09 13:04:43','2026-06-02 10:04:42'),('90160518-61aa-11f1-a5bf-f4390977436c','TNTAD9606','7661ef42-2489-4a4b-9022-ed68fc8cfc04',1,'2026-06-13 16:21:01','2026-06-06 13:21:01'),('9b0737f5-5e62-11f1-81df-f4390977436c','TNTF9F2D2','9857ee42-7199-4d9d-872a-9b99e91b808d',1,'2026-06-09 12:08:23','2026-06-02 09:08:22'),('af968040-5e59-11f1-81df-f4390977436c','TNTB21E3F','20c93417-5d54-11f1-84c3-f4390977436c',1,'2026-06-09 11:04:32','2026-06-02 08:04:31'),('b817b2cd-86f3-403e-bf1b-8c108457c0cc','TNT12BA8','22d36e3e-c9a6-45a2-a116-069ba078b1d7',1,'2026-06-16 12:02:27','2026-06-09 09:02:27'),('cc101fbf-5950-44f6-be4c-cedff6b86261','TNT9DB02','unit-test-001',0,'2026-06-17 12:16:50','2026-06-10 09:16:50'),('d54a21f5-5f03-11f1-81df-f4390977436c','TNTB6FB17','51943933-8054-4581-b210-adbdfd75f2e0',1,'2026-06-10 07:22:29','2026-06-03 04:22:29'),('debdd4f3-e776-44b6-be86-c11f28576ded','TNTF6493','22d36e3e-c9a6-45a2-a116-069ba078b1d7',0,'2026-06-16 16:54:36','2026-06-09 13:54:35'),('f5a5384a-0c52-48c4-bec2-03c7135117a3','TNTF6A4A','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698',1,'2026-06-16 16:36:53','2026-06-09 13:36:53');
/*!40000 ALTER TABLE `tenant_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `property_id` varchar(36) NOT NULL,
  `room_number` varchar(20) NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` enum('Vacant','Occupied','Maintenance','Reserved') NOT NULL DEFAULT 'Vacant',
  `base_rent` decimal(10,2) NOT NULL,
  `deposit_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `water_billing_flow` enum('Metered','Flat','Prepaid Token') DEFAULT 'Flat',
  `electricity_billing_flow` enum('Metered','Flat','Prepaid Token') DEFAULT 'Prepaid Token',
  `garbage_fee` decimal(10,2) DEFAULT '0.00',
  `water_flat_rate` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `property_id` (`property_id`,`room_number`),
  KEY `idx_units_property_id` (`property_id`),
  CONSTRAINT `units_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `units_chk_1` CHECK ((`base_rent` >= 0)),
  CONSTRAINT `units_chk_2` CHECK ((`deposit_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES ('22d36e3e-c9a6-45a2-a116-069ba078b1d7','48319690-66a4-4112-8666-ede996010320','C9','1-Bedroom','Vacant',10000.00,5000.00,'2026-06-04 07:18:00','2026-06-06 13:50:19','Flat','Prepaid Token',0.00,0.00),('51943933-8054-4581-b210-adbdfd75f2e0','633cbc84-ca05-4ad5-87b5-3ee07df83b31','104','Bedsitter','Occupied',5000.00,2500.00,'2026-06-03 04:22:05','2026-06-06 06:28:20','Metered','Prepaid Token',400.00,0.00),('7661ef42-2489-4a4b-9022-ed68fc8cfc04','48319690-66a4-4112-8666-ede996010320','DG43','Bedsitter','Occupied',5000.00,2000.00,'2026-06-06 06:52:02','2026-06-06 13:22:12','Metered','Metered',400.00,0.00),('c43ecd67-790a-4f0f-9a97-064557cf04ad','c5781097-1320-459e-93c0-962f53e60fea','G1','Bedsitter','Vacant',3000.00,1500.00,'2026-06-10 08:44:39','2026-06-10 08:44:39','Flat','Prepaid Token',0.00,0.00),('ca5ccf7f-e245-4b2a-bdb9-587f35409d38','48319690-66a4-4112-8666-ede996010320','N3','Commercial','Vacant',30000.00,15000.00,'2026-06-07 07:05:52','2026-06-07 07:05:52','Flat','Prepaid Token',0.00,0.00),('d7b9d61a-a713-4712-9ef3-71f0345e9ec9','48319690-66a4-4112-8666-ede996010320','hgfds','Commercial','Vacant',12000.00,6000.00,'2026-06-09 13:09:30','2026-06-09 13:09:30','Flat','Prepaid Token',0.00,0.00),('e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','633cbc84-ca05-4ad5-87b5-3ee07df83b31','B8','1-Bedroom','Vacant',20000.00,10000.00,'2026-06-03 04:16:50','2026-06-09 13:08:35','Metered','Metered',200.00,0.00),('e047fb94-e28c-406b-bb83-eca83b5f59d8','c5781097-1320-459e-93c0-962f53e60fea','G3','4 bedroom','Vacant',50000.00,30000.00,'2026-06-10 09:37:12','2026-06-10 09:37:43','Metered','Metered',1000.00,0.00),('unit-test-001','prop-test-001','A1','1-Bedroom','Vacant',10000.00,10000.00,'2026-06-04 08:52:28','2026-06-04 08:52:28','Flat','Prepaid Token',0.00,0.00);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `national_id` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Caretaker','Tenant') NOT NULL DEFAULT 'Tenant',
  `unit_id` varchar(36) DEFAULT NULL,
  `status` enum('Pending','Active','Rejected','Evicted','Inactive','Suspended') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `national_id` (`national_id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone_number`),
  KEY `fk_users_unit_id` (`unit_id`),
  CONSTRAINT `fk_users_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('2b185dfe-6247-11f1-a5bf-f4390977436c','james mithamo','jamesmithamo@gmail.com','0738055555','011294093','$2b$12$ZQHhxeftP353TKAllc68.OMuuqyRkdicwEQZ8WaRSXGcepJjW1Di6','Caretaker',NULL,'Active','2026-06-07 08:02:03','2026-06-09 13:08:57'),('440128cb-5ffd-11f1-a5bf-f4390977436c','loner faith','loner@gmail.com','0712345630','3001133294','$2b$12$RI1RYVjCbLs5ge.7mD0GcumTorqieqboE0k.K7jmnVHU2XpJ3ZCES','Tenant','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','Active','2026-06-04 10:07:59','2026-06-04 10:08:13'),('5f2c4c52-5fe8-11f1-a5bf-f4390977436c','peter kamau','susanmaina@gmail.com','0798765432','2311133100','$2b$10$YPLs9hEUwoFWWw2TbljKaeqh7C0mHMejNGTJmZsDWlxcp38.ZqcaO','Caretaker',NULL,'Inactive','2026-06-04 07:38:25','2026-06-10 08:56:46'),('5f679235-5f03-11f1-81df-f4390977436c','joseph mathenge','josephmathenge003@gmail.com','0712345678','2311133294','$2b$12$/ltx4KRZkhlYQgkG7YgwwOkl4BaBk5wIpoQlAZj3idTeTNrBbbXtC','Tenant','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','Evicted','2026-06-03 04:19:11','2026-06-07 08:15:06'),('6d99c1bf-5ffb-11f1-a5bf-f4390977436c','florence mathenge','florencemathenge@gmial.com','0704000532','2311203294','$2b$12$u/7/UxDIJzlXch5YmJTfUef63n59MipdsWtPW3l2bznC396nV/KcO','Tenant','51943933-8054-4581-b210-adbdfd75f2e0','Active','2026-06-04 09:54:50','2026-06-10 08:33:40'),('80c8985e-5fe9-11f1-a5bf-f4390977436c','samual kamau','josephmathenge@gmail.com','0116606045','2311133300','$2b$12$ulIlx0Qi9K402wGfaVINT.gZ1HfLfvgIzNbHxqIX5XbmCXvTpnEye','Tenant','22d36e3e-c9a6-45a2-a116-069ba078b1d7','Inactive','2026-06-04 07:46:31','2026-06-10 08:00:00'),('b35c6430-61aa-11f1-a5bf-f4390977436c','erastus mwangi','erastusmwangi@gmail.com','0721458793','132459969','$2b$10$QVd24oM6GEJIszZyU2.jUOaepQsg/vZ2n7VdvBqAChTMpz5.1ypQC','Tenant','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Active','2026-06-06 13:22:00','2026-06-06 14:26:42'),('c2e56ba9-5e89-11f1-81df-f4390977436c','System Administrator','admin@estate.com','0700000000','00000000','$2b$12$12iPA7qefNxhsch7rBnLLOk.F1rvOPYkwcQlyKDrQW3Uys0r4LdXO','Admin',NULL,'Active','2026-06-02 13:48:39','2026-06-09 13:07:39'),('e5be11e4-5f03-11f1-81df-f4390977436c','peter maina','silviamutahi@gmail.com','0712345673','2311133218','$2b$12$pVQL0RNCdnlRE7Rbf7RO/eqiwKSSkM79GWJM0YytHLogb08ok3Klq','Tenant','51943933-8054-4581-b210-adbdfd75f2e0','Inactive','2026-06-03 04:22:56','2026-06-10 08:57:15');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utility_readings`
--

DROP TABLE IF EXISTS `utility_readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utility_readings` (
  `id` varchar(36) NOT NULL DEFAULT (uuid()),
  `lease_id` varchar(36) NOT NULL,
  `unit_id` varchar(36) NOT NULL,
  `utility_type` enum('Water','Electricity') NOT NULL,
  `previous_reading` decimal(10,2) NOT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `units_consumed` decimal(10,2) GENERATED ALWAYS AS ((`current_reading` - `previous_reading`)) STORED,
  `rate_per_unit` decimal(10,2) NOT NULL,
  `total_cost` decimal(10,2) GENERATED ALWAYS AS (((`current_reading` - `previous_reading`) * `rate_per_unit`)) STORED,
  `reading_date` date NOT NULL,
  `recorded_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `invoice_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lease_id` (`lease_id`),
  KEY `recorded_by` (`recorded_by`),
  KEY `fk_utility_readings_unit` (`unit_id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `fk_utility_readings_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`),
  CONSTRAINT `utility_readings_ibfk_1` FOREIGN KEY (`lease_id`) REFERENCES `leases` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `utility_readings_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `utility_readings_ibfk_3` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `chk_meter_math` CHECK ((`current_reading` >= `previous_reading`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utility_readings`
--

LOCK TABLES `utility_readings` WRITE;
/*!40000 ALTER TABLE `utility_readings` DISABLE KEYS */;
INSERT INTO `utility_readings` (`id`, `lease_id`, `unit_id`, `utility_type`, `previous_reading`, `current_reading`, `rate_per_unit`, `reading_date`, `recorded_by`, `created_at`, `invoice_id`) VALUES ('41d2bff4-6408-11f1-a09c-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b','51943933-8054-4581-b210-adbdfd75f2e0','Water',20.00,30.00,40.00,'2026-06-09','2b185dfe-6247-11f1-a5bf-f4390977436c','2026-06-09 13:36:45',NULL),('56ce9541-5dc0-11f1-8db1-f4390977436c','e3a545ed-5bdf-11f1-b095-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Water',0.00,18.00,40.00,'2026-06-01','2a114b05-5dbb-11f1-8db1-f4390977436c','2026-06-01 13:46:49',NULL),('670c0b8a-64ac-11f1-95e5-f4390977436c','213a27d3-54ff-4f57-bd06-61e5b11e2211','e003daf4-cd3c-42d7-a9dc-e0c9b8dae698','Electricity',0.00,14.00,13.00,'2026-06-10','2b185dfe-6247-11f1-a5bf-f4390977436c','2026-06-10 09:11:45',NULL),('98a7f129-6171-11f1-a5bf-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b','51943933-8054-4581-b210-adbdfd75f2e0','Water',0.00,15.00,40.00,'2026-06-02','80c8985e-5fe9-11f1-a5bf-f4390977436c','2026-06-06 06:33:14',NULL),('9a7d15a1-5e7f-11f1-81df-f4390977436c','e3a545ed-5bdf-11f1-b095-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Water',18.00,20.00,30.00,'2026-06-02','2a114b05-5dbb-11f1-8db1-f4390977436c','2026-06-02 12:35:57',NULL),('bf4efb7f-61a6-11f1-a5bf-f4390977436c','259f8a70-b477-4372-b969-06f39d9b3d1b','51943933-8054-4581-b210-adbdfd75f2e0','Water',15.00,20.00,13.00,'2026-06-06','5f2c4c52-5fe8-11f1-a5bf-f4390977436c','2026-06-06 12:53:42',NULL),('eec3fc19-5be0-11f1-b095-f4390977436c','e3a545ed-5bdf-11f1-b095-f4390977436c','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Electricity',0.00,120.00,16.00,'2026-05-30','135391d7-5bdb-11f1-b095-f4390977436c','2026-05-30 04:35:06',NULL),('f67194de-61aa-11f1-a5bf-f4390977436c','fe320e05-af6b-4469-b084-93bf15e9eb11','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Electricity',0.00,10.00,17.00,'2026-06-06','5f2c4c52-5fe8-11f1-a5bf-f4390977436c','2026-06-06 13:23:53',NULL),('fd7d2568-61ac-11f1-a5bf-f4390977436c','fe320e05-af6b-4469-b084-93bf15e9eb11','7661ef42-2489-4a4b-9022-ed68fc8cfc04','Electricity',10.00,39.00,17.00,'2026-07-01','5f2c4c52-5fe8-11f1-a5bf-f4390977436c','2026-06-06 13:38:24','0751a4bb-61ad-11f1-a5bf-f4390977436c');
/*!40000 ALTER TABLE `utility_readings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-10 14:19:21
