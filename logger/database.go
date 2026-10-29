package logger

import (
	"time"

	"github.com/rs/zerolog/log"
)

// DatabaseLogger logs sql queries
type DatabaseLogger struct {
}

// Print pretty prints the gorm.DB log values
// Mostly copied from https://github.com/jinzhu/gorm/blob/master/logger.go
func (l *DatabaseLogger) Print(values ...interface{}) {
	if len(values) > 1 {
		var (
			level = values[0]
		)

		if level == "sql" {
			// SQL text and values may both contain secrets; retain only timing and row counts.
			log.Debug().Str("took", values[2].(time.Duration).String()).Int64("rows", values[5].(int64)).Msg("SQL statement completed")
		} else if level == "log" {
			if len(values) > 2 {
				if err, ok := values[2].(error); ok {
					_ = err
					log.Error().Msg("Database error")
					return
				}
			}
			log.Debug().Msg("Database diagnostic")
		} else {
			log.Error().Msgf("DatabaseLogger: cannot handle level %#v", level)
		}
	}
	// ignore empty log
}
