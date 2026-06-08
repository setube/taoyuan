package main

import (
	"log"
	"net/http"

	"taoyuan-backend/internal/config"
	"taoyuan-backend/internal/handler"
	"taoyuan-backend/internal/knowledge"
	"taoyuan-backend/internal/search"
	"taoyuan-backend/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
)

func main() {
	cfg := config.Load()

	// 加载知识库（从内部分片 JSON 文件合并）
	doc, err := knowledge.LoadDir("internal/knowledge")
	if err != nil {
		log.Fatalf("加载知识库失败: %v", err)
	}
	log.Printf("知识库已加载: %d 条, %d 个分类", len(doc.Entries), len(doc.Categories))

	// 构建搜索索引
	idx := search.NewIndex(doc)

	// 初始化存储：优先 MySQL（需配置 MYSQL_DSN），否则使用 SQLite
	var db store.Store
	if cfg.MySQLDSN != "" {
		mysqlDB, err := store.NewMySQL(cfg.MySQLDSN)
		if err != nil {
			log.Printf("MySQL 连接失败（降级到 SQLite）: %v", err)
		} else {
			db = mysqlDB
			log.Println("MySQL 已连接")
		}
	}
	if db == nil {
		sqliteDB, err := store.NewSQLite("data/taoyuan.db")
		if err != nil {
			log.Fatalf("SQLite 初始化失败: %v", err)
		}
		db = sqliteDB
		log.Println("SQLite 已就绪")
	}
	defer db.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// CORS
	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler)

	h := handler.New(idx, db, cfg)

	r.Route("/api/v1", func(r chi.Router) {
		// 知识库
		r.Get("/knowledge/search", h.SearchKnowledge)
		r.Get("/knowledge/categories", h.ListCategories)
		r.Get("/knowledge/{id}", h.GetKnowledgeEntry)

		// 对话
		r.Post("/chat", h.Chat)

		// 存档
		r.Get("/saves", h.ListSaves)
		r.Post("/saves/upload", h.UploadSave)
		r.Get("/saves/{slot}/download", h.DownloadSave)
		r.Delete("/saves/{slot}", h.DeleteSave)

		// 设备注册
		r.Post("/device/register", h.RegisterDevice)
	})

	addr := ":" + cfg.Port
	log.Printf("后端服务启动于 %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}