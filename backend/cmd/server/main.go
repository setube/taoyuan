package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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

	// CORS — AllowCredentials 不能与 Origin * 共用，前端用 Bearer Token 无需 Credentials
	r.Use(cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
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

	// 静态文件服务 + SPA fallback
	r.NotFound(serveSPA())

	addr := ":" + cfg.Port
	log.Printf("后端服务启动于 %s (含前端静态文件)", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}

// serveSPA 返回一个 SPA 静态文件处理器：优先从磁盘 docs/ 加载，回退到内嵌的 docs/
func serveSPA() http.HandlerFunc {
	// 优先使用磁盘上的 docs 目录（方便热更）
	for _, dir := range []string{"docs", "dist"} {
		if _, err := os.Stat(dir); err == nil {
			fsys := http.Dir(dir)
			fileServer := http.FileServer(fsys)
			log.Printf("静态文件: 使用磁盘目录 %s/", dir)
			return func(w http.ResponseWriter, r *http.Request) {
				path := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
				f, err := fsys.Open(path)
				if err != nil {
					r.URL.Path = "/"
					fileServer.ServeHTTP(w, r)
					return
				}
				f.Close()
				fileServer.ServeHTTP(w, r)
			}
		}
	}

	// 回退到内嵌目录
	log.Println("静态文件: 使用内嵌资源")
	subFS, err := fs.Sub(frontendFS, "docs")
	if err != nil {
		log.Println("警告: 前端静态文件不可用（docs 目录不存在且内嵌资源加载失败）")
		return func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "前端未部署", http.StatusNotFound)
		}
	}
	fileServer := http.FileServer(http.FS(subFS))
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
		f, err := subFS.Open(path)
		if err != nil {
			r.URL.Path = "/"
			fileServer.ServeHTTP(w, r)
			return
		}
		f.Close()
		fileServer.ServeHTTP(w, r)
	}
}